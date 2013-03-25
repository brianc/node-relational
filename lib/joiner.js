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

Joiner.prototype.columns = function() {
  var cols = []
  for(var i = 0; i < arguments.length; i++) {
    var table = arguments[i];
    var tableName = table.getName();
    for(var j = 0; j < table.columns.length; j++) {
      var col = table.columns[j];
      cols.push(col.as(tableName + '.' + col.name));
    }
  }
  return cols;
};

//calculate an innerJoin path between 'from' table and 'to' table
Joiner.prototype.join = function(from, to) {
  //TODO this is ugly
  var fromCols = find(from, to);
  assert(fromCols.length <= 1, "Does not support auto-multi-column joins yet");
  var fromCol = fromCols.pop();
  if(fromCol) {
    var result = from.join(to).on(fromCol);
    return result;
  }
  var toCols = find(to, from);
  assert(toCols.length <= 1, "Does not support auto-multi-column joins yet");
  var toCol = toCols.pop();
  if(toCol) {
    var result = from.join(to).on(toCol);
    return result;
  }
  throw new Error("could not find join between tables");
};

//calculate an innerJoin path between 'from' table and 'to' table
Joiner.prototype.leftJoin = function(from, to) {
  //TODO this is ugly
  var fromCols = find(from, to);
  assert(fromCols.length <= 1, "Does not support auto-multi-column joins yet");
  var fromCol = fromCols.pop();
  if(fromCol) {
    var result = from.leftJoin(to).on(fromCol);
    return result;
  }
  var toCols = find(to, from);
  assert(toCols.length <= 1, "Does not support auto-multi-column joins yet");
  var toCol = toCols.pop();
  if(toCol) {
    var result = from.leftJoin(to).on(toCol);
    return result;
  }
  throw new Error("could not find join between tables");
};

