var assert = require('assert');
var path = require('path');
var sql = require('sql');
var Joiner = require(__dirname + '/lib/joiner');
var Mapper = require(__dirname + '/lib/mapper');

var relational = {

};

var Schema = function() {
  this.plugins = [];
  for(var i = 0; i < relational.plugins.length; i++) {
    this.plugins.push(relational.plugins[i]);
  }
};

Schema.prototype.addTable = function(tableDefinition) {
  var table = sql.define(tableDefinition);
  table.columns.forEach(function(col) {
    //normalize public api of foreignKey/foreignKeys
    col.getForeignKeys = function() {
      if(!this.foreignKey) return [];
      return [this.foreignKey];
    }
    col.getForeignColumn = function(otherTable) {
      //get all foreign keys for this column
      var fks = col.getForeignKeys();
      //loop over foreign keys in this column
      for(var i = 0; i < fks.length; i++) {
        //if foreign key references other table
        if(fks[i].table == otherTable.getName()) {
          //return the foreign column
          return otherTable.getColumn(fks[i].column);
        }
      }
    };
  });
  var schema = this;
  table.joinTo = function(other) {
    return new Joiner(schema).join(table, other);
  }
  this[table.getName()] = table;
};

Schema.prototype.getTable = function(name) {
  var table = this[name];
  if(!table) throw new Error("Cannot find table " + name);
  return table;
};

var Relationship = function(config) {
  //source should be a model
  this.source = config.source;
  //target should be a model
  this.target = config.target;
  //type used in debugging currently
  this.type = config.type;
  //name is used for property & accessor names
  this.name = config.name;
  this.eager = config.eager || false;
};

//returns ordered list of relationship tables
Relationship.prototype.getTables = function() {
  return [this.source.table, this.target.table];
};

Relationship.prototype.getColumns = function() {
  return this.source.table.columns.concat(this.target.table.columns);
}

Relationship.prototype.toString = function() {
  return "RELATIONSHIP"  
}

//define a model
Schema.prototype.define = function(table, config) {
  relational.log('defining model for table %s', table);
  var table = this.getTable(table);
  var Constructor = function() {};
  Constructor.prototype.isSaved = function() {
    return false;
  };
  Constructor.isModel = true;
  Constructor.table = table;
  Constructor.getName = table.getName.bind(table);
  //bulk copy public properties
  Constructor.prototype.apply = function(other) {
    for(var i = 0; i < table.columns.length; i++) {
      var column = table.columns[i];
      if(column.readOnly) continue;
      this[column.name] = other[column.name];
    }
  };
  var relationships = [];
  Constructor.addRelationship = function(config) {
    var relationship = new Relationship(config);
    relationships.push(relationship);
    if(config.eager) {
      Constructor.prototype[config.name] = [];
      Constructor.mapper.addRelationship(relationship);
    }
  };
  //returns a relationship between this model
  //and a sibling model.
  //TODO currently this THROWs if there is more than 1
  Constructor.getRelationship = function(other) {
    var result = [];
    for(var i = 0; i < relationships.length; i++) {
      var relationship = relationships[i];
      if(relationship.other === other) {
        result.push(relationship);
      }
    }
    assert.equal(result.length, 1, "only 1 relationship to each model is supported now but found " + result.length);
    return result.pop();
  };
  for(var i = 0; i < this.plugins.length; i++) {
    var plugin = this.plugins[i];
    relational.log('applying plugin %s to %s', plugin.name, table.getName());
    plugin.init(this, Constructor);
  }
  Constructor.mapper = new Mapper(Constructor);
  return Constructor;
};

var addPlugin = function(list, name, init) {
  if(typeof name == 'string') {
    if(!init) {
      try {
        init = require(__dirname + '/plugins/' + name);
        relational.log('loaded internal plugin %s', name);
      } catch(e) {
        try {
          init = require(name);
          relational.log('loaded external plugin %s', name);
        } catch(e) {
          try {
            init = require('relational-' + name);
            relational.log('loaded external plugin relational-%s', name);
          } catch(e) {
            throw new Error('Could not find plugin named "' + name + '" or "relational-' + name + '"');
          }
        }
      }
    }
  }
  for(var i = 0; i < list.length; i++) {
    var plugin = list[i];
    if(plugin.name == name) {
      relational.log('skipping reregister of plugin %s', name);
      return;
    }
  }
  relational.log('registering plugin %s', name);
  list.push({ name: name, init: init });
};

Schema.prototype.use = function(name, init) {
  addPlugin(this.plugins, name, init);
}


//define a new schema
relational.define = function(config) {
  var schema = new Schema();
  var tables = config.tables || [];
  tables.forEach(schema.addTable.bind(schema));
  tables.forEach(function(tableDefinition) {
    tableDefinition.columns.forEach(function(colDef) {
      if(colDef.foreignKey) {
        var ref = colDef.foreignKey;
        var foreignTable = schema.getTable(ref.table);
        var currentTable = schema.getTable(tableDefinition.name);
      }
    });
  });
  return schema;
};


relational.log = function() {
}

relational.plugins = [];

relational.use = function(name, init) {
  addPlugin(relational.plugins, name, init);
};

//global standard plugins
relational.use('execute', function(schema, Ctor) {
  Ctor.execute = function(instance, action, query, cb) {
    query.execute = function(cb) {
      schema.db.query(query, cb);
    }
    if(cb) {
      query.execute(cb);
    }
    return query;
  };
});

relational.use('row-map', function(schema, Ctor) {
  var exec = Ctor.execute;
  Ctor.prototype.getRow = function() {
    return null;
  };

  var map = function(cb) {
    return function(err, rows) {
      if(err) return cb(err);
      var results = Ctor.mapper.map(rows);
      return cb(null, results);
    };
  };

  Ctor.execute = function(instance, action, query, cb) {
    if(!cb) {
      query.execute = function(cb) {
        schema.db.query(query, map(cb));
      };
      return query;
    }
    return exec(instance, action, query, map(cb));
  };
});

relational.use('insert', function(schema, Ctor) {
  Ctor.insert = function(item, cb) {
    var table = this.table;
    var record = {};
    for(var i = 0; i < table.columns.length; i++) {
      var col = table.columns[i];
      if(col.readOnly) continue;
      record[col.name] = item[col.name];
    }
    var query = table.insert(record).returning('*');
    return Ctor.execute(item, 'insert', query, cb);
  };
});

relational.use('update', function(schema, Ctor) {
  Ctor.prototype.update = function(cb) {
    if(!this.isSaved()) {
      throw new Error("TODO: cannot update an unsaved model");
    }
    var table = Ctor.table;
    var record = {};
    var where = {};
    for(var i = 0; i < table.columns.length; i++) {
      var col = table.columns[i];
      if(col.primaryKey) {
        where[col.name] = this.getRow()[col.name];
        continue;
      }
      if(col.readOnly) continue;
      record[col.name] = this[col.name];
    }
    var query = table.update(record).where(where).returning('*'); 
    return Ctor.execute(this, 'update', query, cb);
  };
});

relational.use('destroy', function(schema, Ctor) {
  Ctor.prototype.destroy = function(cb) {
    var table = Ctor.table;
    var where = {};
    for(var i = 0; i < table.columns.length; i++) {
      var col = table.columns[i];
      if(col.primaryKey) {
        where[col.name] = this[col.name];
      }
    }
    var query = table.delete().where(where);
    return Ctor.execute(this, 'delete', query, cb);
  };
});

relational.use('where', function(schema, Ctor) {
  Ctor.where = function(filter, cb) {
    var table = Ctor.table;
    var clause = table.select(table.star()).where(filter);
    return Ctor.execute(this, 'find', clause, cb);
  };
});

module.exports = relational;
