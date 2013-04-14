var assert = require('assert');
var path = require('path');
var sql = require('sql');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Joiner = require(__dirname + '/lib/joiner');
var Mapper = require(__dirname + '/lib/mapper');

var relational = function() {
  this.schema = new Schema();
};

var id = 0;
var Schema = function() {
  EventEmitter.call(this);
  this.plugins = [];
  this._tables = [];
  this._relationships = [];
  this.id = id++;
  for(var i = 0; i < relational.plugins.length; i++) {
    this.plugins.push(relational.plugins[i]);
  }
};

util.inherits(Schema, EventEmitter);

var Finder = function(schema, table) {
  this.schema = schema;
  this.table = table;
  this.relationships = [];
  this.join = undefined;
};

Finder.prototype.toQuery = function() {
  if(this.relationships.length) {
    var joiner = new Joiner();
    for(var i = 0; i < this.relationships.length; i++) {
      var rel = this.relationships[i];
      if(rel.through) {
        var joinClause = joiner.throughJoin(rel.from, rel.through, rel.to);
      }
    }
    return this.table.from(joinClause).toQuery();
  }
  return this.table.select("*").toQuery();
};

Finder.prototype.include = function(relationshipName) {
  var rel = this.schema.getRelationship(this.table, relationshipName);
  assert(rel, 'Could not find relationship from ' + this.table.getName() + ' with name "' + relationshipName + '"');
  this.relationships.push(rel);
  return this;
};

Finder.run = function() {
  
};

Schema.prototype.find = function(tableName) {
  return new Finder(this, this.getTable(tableName));
};

Schema.prototype.addTable = function(tableDefinition) {
  var table = sql.define(tableDefinition);
  table.columns.forEach(function(col) {
    //normalize public api of foreignKey
    col.getForeignKey = function() {
      return this.foreignKey;
    }
    col.getForeignColumn = function(otherTable) {
      //get all foreign keys for this column
      var fks = col.getForeignKey();
      if(fks) {
        //if foreign key references other table
        if(fks.table == otherTable.getName()) {
          //return the foreign column
          return otherTable.getColumn(fks.column);
        }
      }
    };
  });
  var schema = this;
  table.joinTo = function(other) {
    return new Joiner(schema).joinTo(table, other);
  };

  this._tables.push(table);
};

Schema.prototype.addRelationship = function(config) {
  config.from = this.getTable(config.from);
  config.to = this.getTable(config.to);
  if(config.through) {
    config.through = this.getTable(config.through);
  }
  this._relationships.push(config);
};

//returns the relationship for the given table
//with the given name. returns null if no relationship found
Schema.prototype.getRelationship = function(table, name) {
  return this._relationships.filter(function(rel) {
    return rel.name == name && rel.from == table;
  }).pop();
};

Schema.prototype.getTable = function(name) {
  for(var i = 0; i < this._tables.length; i++) {
    var table = this._tables[i];
    if(table.getName() == name) return table;
  }
  if(!table) throw new Error("Cannot find table " + name);
};

Schema.prototype.getTables = function() {
  return this._tables;
};

var Model = require(__dirname + '/lib/model');
//define a model
Schema.prototype.define = function(table, config) {
  relational.log('defining model for table %s', table);
  var table = this.getTable(table);
  var Constructor = Model._define({
    table: table,
    schema: this
  });
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

relational.use('row-map', function(schema, Ctor) {
  //actually execute and map the query
  //expects a 'config' object with following properties
  //query: anything responding to #toQuery() -> {text: queryText, values: [arrayOfParams]}
  //callback: the thing to call when all the query stuff is done
  //mapper (optional): custom mapper class, must respond to #map([rows]) and return collection of instances
  Ctor.execute = function(config) {
    var c = config;
    c.mapper = c.mapper || Ctor.mapper;
    var query = c.query;
    query.execute = function(cb) {
      schema.db.query(query, function(err, rows) {
        if(err) return cb(err);
        var results = c.mapper.map(rows);
        return cb(null, results);
      });
    };
    if(!c.callback) {
      return query;
    }
    return query.execute(c.callback);
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
    return Ctor.execute({
      query: query,
      callback: cb,
      //use default mapper for inserts
      mapper: new Mapper(Ctor)
    });
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
        where[col.name] = this[col.name];
        continue;
      }
      if(col.readOnly) continue;
      record[col.name] = this[col.name];
    }
    var query = table.update(record).where(where).returning('*'); 
    return Ctor.execute({
      query: query,
      callback: cb,
      //use default mapper for updates
      mapper: new Mapper(Ctor)
    });
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
    return Ctor.execute({
      query: query,
      callback: cb
    });
  };
});

relational.use('where', function(schema, Ctor) {
  Ctor.where = function(filter, cb) {
    var scope = Ctor.mapper.createScope();
    var clause = scope.where(filter);
    return Ctor.execute({
      query: clause,
      callback: cb
    });
  };
});

module.exports = relational;
