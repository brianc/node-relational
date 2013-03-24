var assert = require('assert');

var Joiner = module.exports = function(schema) {
  this.schema = schema;
};

//find a join clause between left and right table
var find = function(left, right) {
  var result = [];
  for(var i = 0; i < left.columns.length; i++) {
    var col = left.columns[i];
    var rightCol = col.getForeignColumn(right);
    if(rightCol) {
      result.push(col.equals(rightCol));
    }
  }
  return result;
};

//calculate a join path between 'from' table and 'to' table
Joiner.prototype.join = function(from, to) {
  //TODO this is ugly
  var fromCols = find(from, to);
  assert(fromCols.length <= 1, "Does not support auto-multi-column joins yet");
  var fromCol = fromCols.pop();
  if(fromCol) {
    return from.join(to).on(fromCol);
  }
  var toCols = find(to, from);
  assert(toCols.length <= 1, "Does not support auto-multi-column joins yet");
  var toCol = toCols.pop();
  if(toCol) {
    return from.join(to).on(toCol);
  }
};

