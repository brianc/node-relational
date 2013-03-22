var path = require('path');
var sql = require('sql');

var relational = function() {
};

relational.prototype.getTable = function(name) {
  var table = this[name];
  if(!table) throw new Error("Cannot find table " + name);
  return table;
};

relational.define = function(config) {
  var schema = new relational();
  var tables = config.tables || [];
  tables.forEach(relational.addTable.bind(relational, schema));
  tables.forEach(function(tableDefinition) {
    tableDefinition.columns.forEach(function(colDef) {
      if(colDef.references) {
        var ref = colDef.references;
        var foreignTable = schema.getTable(ref.table);
        var currentTable = schema.getTable(tableDefinition.name);
      }
    });
  });
  return schema;
};

relational.prototype.define = function(table, config) {
  return relational.defineModel(this, table, config);
};

relational.addTable = function(schema, tableDefinition) {
  var table = sql.define(tableDefinition);
  schema[table.getName()] = table;
}

relational.defineModel = function(schema, table, config) {
  var table = schema.getTable(table);
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
  }
  Constructor.prototype.isSaved = function() {
    return false;
  };
  Constructor.isModel = true;
  Constructor.table = table;
  Constructor.schema = schema;
  relational.plugins.forEach(function(plugin) {
    relational.log('applying plugin %s to %s', plugin.name, table.getName());
    plugin.action(relational, Constructor);
  });
  return Constructor;
};

relational.log = function() {
  console.log.apply(console, arguments);
}

relational.plugins = [];

relational.register = function(name, action) {
  relational.plugins.push({ name: name, action: action });
};

relational.register('execute', function(relational, Ctor) {
  Ctor.execute = function(instance, action, query, cb) {
    query.execute = function(cb) {
      relational.db.query(query, cb);
    }
    if(cb) {
      query.execute(cb);
    }
    return query;
  };
});

relational.register('row-map', function(relational, Ctor) {
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

  Ctor.execute = function(instance, action, query, cb) {
    if(!cb) return exec(instance, action, query, cb);
    return exec(instance, action, query, function(err, rows) {
      var results = [];
      for(var i = 0; i < (rows||0).length; i++) {
        results.push(Ctor.fromRow(rows[i]));
      }
      cb(err, results);
    });
  };
});

relational.register('insert', function(relational, Ctor) {
  Ctor.prototype.insert = function(cb) {
    var table = Ctor.table;
    var record = {};
    for(var i = 0; i < table.columns.length; i++) {
      var col = table.columns[i];
      if(col.readOnly) continue;
      record[col.name] = this[col.name];
    }
    var query = table.insert(record).returning('*');
    return Ctor.execute(this, 'insert', query, cb);
  };
});

relational.register('update', function(relational, Ctor) {
  Ctor.prototype.update = function(cb) {
    var table = Ctor.table;
    var record = {};
    var where = {};
    for(var i = 0; i < table.columns.length; i++) {
      var col = table.columns[i];
      if(col.primaryKey) {
        where[col.name] = this[col.name];
      }
      if(col.readOnly) continue;
      record[col.name] = this[col.name];
    }
    var query = table.update(record).where(where).returning('*'); 
    return Ctor.execute(this, 'update', query, cb);
  };
});

relational.register('destroy', function(relational, Ctor) {
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

relational.register('find', function(relational, Ctor) {
  Ctor.find = function(filter, cb) {
    var table = Ctor.table;
    var clause = table.select(table.star()).where(filter);
    return Ctor.execute(this, 'find', clause, cb);
  };
});

module.exports = relational;
