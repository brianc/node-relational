var assert = require('assert');

var Relationship = module.exports = function(config) {
  //source should be a model
  this.source = config.source;
  //target should be a model
  this.other = config.other;
  //type used in debugging currently
  this.type = config.type;
  //name is used for property & accessor names
  this.name = config.name;
  this.eager = config.eager || false;
};

//returns ordered list of relationship tables
Relationship.prototype.getTables = function() {
  return [this.source.table, this.other.table];
};

Relationship.prototype.getColumns = function() {
  return this.source.table.columns.concat(this.other.table.columns);
};
