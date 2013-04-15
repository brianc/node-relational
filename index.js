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
  this._plugins = [];
  this._tables = [];
  this._relationships = [];
  this.id = id++;
  for(var i = 0; i < relational.plugins.length; i++) {
    var plugin = relational.plugins[i];
    this.use(plugin.name, plugin.init);
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

Finder.prototype._getMapper = function() {
  var mapper = new Mapper(this.table);
  for(var i = 0; i < this.relationships.length; i++) {
    mapper.addRelationship(this.relationships[0]);
  }
  return mapper;
};

Finder.prototype.execute = function(callback) {
  var self = this;
  this.schema.db.query(this, function(err, rows) {
    if(err) return callback(err);
    callback(null, self._getMapper().map(rows));
  });
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
      return {init: function() {}};
    }
  }
  relational.log('registering plugin %s', name);
  var plugin = { name: name, init: init };
  list.push(plugin);
  return plugin;
};

Schema.prototype.use = function(name, init) {
  var plugin = addPlugin(this._plugins, name, init);
  plugin.init(this);
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

module.exports = relational;
