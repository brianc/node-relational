var assert = require('assert');
var path = require('path');
var sql = require('sql');
var Joiner = require(__dirname + '/lib/joiner');
var Mapper = require(__dirname + '/lib/mapper');

var relational = function() {
  this.schema = new Schema();
};

relational.prototype.model = function(config) {
  assert(config.tableName || config.name, "cannot make an unnamed model");
  var table = {
    name: config.tableName || config.name,
    columns: config.columns
  };
  this.schema.addTable(table);
  return this.schema.define(config.name);
};

var id = 0;
var Schema = function() {
  this.plugins = [];
  this._tables = [];
  this.id = id++;
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
  this._tables.push(table);
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
      callback: cb
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
        where[col.name] = this.getRow()[col.name];
        continue;
      }
      if(col.readOnly) continue;
      record[col.name] = this[col.name];
    }
    var query = table.update(record).where(where).returning('*'); 
    return Ctor.execute({
      query: query,
      callback: cb
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
