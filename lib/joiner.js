var assert = require('assert');

var Joiner = module.exports = function(schema) {
  this.schema = schema;
};

//calculate a join path between 'from' table and 'to' table
Joiner.prototype.join = function(from, to) {
  //TODO this is ugly
  var fromCols = from.columns.filter(function(col) {
    return col.references && col.references.table == to.getName();
  });
  assert(fromCols.length <= 1, "Does not support auto-multi-column joins yet");
  var fromCol = fromCols.pop();
  if(fromCol) {
    return from.join(to).on(fromCol.equals(to.getColumn(fromCol.references.column)));
  }
  var toCols = to.columns.filter(function(col) {
    return col.references && col.references.table == from.getName();
  });
  assert(toCols.length <= 1, "Does not support auto-multi-column joins yet");
  var toCol = toCols.pop();
  if(toCol) {
    return from.join(to).on(toCol.equals(from.getColumn(toCol.references.column)));
  }
};

