var util = require('util');
var assert = require('assert');

var Mapper = require(__dirname + '/mapper');
var Relationship = require(__dirname + '/relationship');
//the "base class" for model prototypes
var Constructor = module.exports = function() {
  this.$row = {};
};
Constructor.isModel = true;

//needs to be set with setTable() call
Constructor.table = undefined;
//holds 'getters'
Constructor.getters = {};

Constructor.setTable = function(table) {
  var self = this;
  assert(!self.table, "Cannot set table, already set");
  self.table = table;
  table.columns.forEach(function(col) {
    self.getters[col.name] = function() { return this[col.name] };
  });
  var relationships = [];
  self.addRelationship = function(config) {
    var relationship = new Relationship(config);
    relationships.push(relationship);
    if(config.eager) {
      self.prototype[config.name] = [];
      self.mapper.addRelationship(relationship);
    }
  };
  //returns a relationship between this model
  //and a sibling model.
  //TODO currently this THROWs if there is more than 1
  self.getRelationship = function(other) {
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
  return this;
};

Constructor.getName = function() {
  return this.table.getName();
};

Constructor.getPrimaryKeys = function() {
  return this.table.columns.filter(function(col) {
    return col.primaryKey;
  });
};


//create child models - inheritance helper
Constructor._define = function(config) {
  var schema = config.schema;
  var Klass = function() { Constructor.apply(this, arguments); };

  //share class methods
  for(var key in Constructor) {
    Klass[key] = Constructor[key];
  }
  util.inherits(Klass, Constructor);
  Klass.setTable(config.table);
  Klass.mapper = new Mapper(Klass);
  for(var i = 0; i < schema.plugins.length; i++) {
    var plugin = schema.plugins[i];
    plugin.init(schema, Klass);
  }
  return Klass;
};

//dynamic getter
Constructor.prototype.get = function(propertyName) {
  var getter = this.constructor.getters[propertyName];
  return getter.apply(this, arguments);
};

//dynamic setter
Constructor.prototype.set = function(propertyName, propertyValue) {
  this[propertyName] = propertyValue;
};

//internal setter used by mapper
Constructor.prototype.$set = function(propertyName, propertyValue) {
  this.set(propertyName, propertyValue);
  this.$row[propertyName] = propertyValue;
};

Constructor.prototype.isSaved = function() {
  for(var key in this.$row) {
    return true;
  }
  return false;
};

Constructor.prototype.isDirty = function() {
  var columns = this.constructor.table.columns;
  for(var i = 0; i < columns.length; i++) {
    var col = columns[i];
    if(this[col.name] != this.$row[col.name]) {
      return true;
    }
  }
  return false;
};

Constructor.prototype.toJSON = function() {
  var columns = this.constructor.table.columns;
  var result = {};
  for(var i = 0; i < columns.length; i++) {
    var col = columns[i];
    result[col.name] = this[col.name];
  }
  return result;
};

//tests equality by checking if primary key columns
//are equal in two instances
//TODO this can be compiled
Constructor.prototype.equals = function(other) {
  var table = this.constructor.table;
  if(!other) return false;
  if(other.constructor.table != table) return false;
  for(var i = 0; i < table.columns.length; i++) {
    var col = table.columns[i];
    if(!col.primaryKey) continue;
    if(this[col.name] !== other[col.name]) return false;
  }
  return true;
};
