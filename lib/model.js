var assert = require('assert');
var Mapper = require(__dirname + '/mapper');
var Relationship = require(__dirname + '/relationship');
//the "base class" for model prototypes
var Constructor = module.exports = function() {

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
}
Constructor.getName = function() {
  return this.table.getName();
};

var util = require('util');

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

//bulk copy public properties
//TODO - delete this
Constructor.prototype.apply = function(other) {
  var table = this.constructor.table;
  for(var i = 0; i < table.columns.length; i++) {
    var column = table.columns[i];
    if(column.readOnly) continue;
    this[column.name] = other[column.name];
  }
};

Constructor.prototype.isSaved = function() {
  return false;
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
