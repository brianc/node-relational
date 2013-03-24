var path = require('path');
var sql = require('sql');
var Joiner = require(__dirname + '/lib/joiner');

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

//define a model
Schema.prototype.define = function(table, config) {
  relational.log('defining model for table %s', table);
  var table = this.getTable(table);
  var Constructor = function() {};
  Constructor.prototype.toJSON = function() {
    var cols = this.constructor.table.columns;
    var safe = {};
    for(var i = 0; i < cols.length; i++) {
      var col = cols[i];
      if(col.private) continue;
      safe[col.name] = this[col.name];
    }
    return safe;
  };
  Constructor.prototype.isSaved = function() {
    return false;
  };
  Constructor.isModel = true;
  Constructor.table = table;
  for(var i = 0; i < this.plugins.length; i++) {
    var plugin = this.plugins[i];
    relational.log('applying plugin %s to %s', plugin.name, table.getName());
    plugin.init(this, Constructor);
  }
  return Constructor;
};

var addPlugin = function(list, name, init) {
  if(typeof name == 'string') {
    if(!init) {
      try {
        init = require(__dirname + '/plugins/' + name).init;
      } catch(e) {
        try {
          init = require(name).init;
        } catch(e) {
          try {
            init = require('relational-' + name).init
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

  Ctor.fromRow = function(row) {
    var instance = new Ctor();
    instance.isSaved = function() {
      return true;
    }
    for(var i = 0; i < Ctor.table.columns.length; i++) {
      var col = Ctor.table.columns[i];
      instance[col.name] = row[col.name];
      instance.getRow = function() {
        return row;
      };
    }
    return instance;
  };

  var map = function(cb) {
    return function(err, rows) {
      var results = [];
      for(var i = 0; i < (rows||0).length; i++) {
        results.push(Ctor.fromRow(rows[i]));
      }
      cb(err, results);
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

relational.use('find', function(schema, Ctor) {
  Ctor.find = function(filter, cb) {
    var table = Ctor.table;
    var clause = table.select(table.star()).where(filter);
    return Ctor.execute(this, 'find', clause, cb);
  };
});

module.exports = relational;
