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

var JOIN_TOKEN = '.';
Joiner.prototype.columns = function() {
  var cols = []
  for(var i = 0; i < arguments.length; i++) {
    var table = arguments[i];
    var alias = this.getTableAlias(table);
    for(var j = 0; j < table.columns.length; j++) {
      var col = table.columns[j];
      cols.push(col.as(alias + col.name));
    }
  }
  return cols;
};

//returns a unique list of table aliases
//in an array based on a supplied array of tables
Joiner.prototype.getTableAlias = function(table) {
  return table.getName() + JOIN_TOKEN;
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

Joiner.prototype.throughJoin = function(from, through, to) {
  var clause = from.leftJoin(through);
  var cols = find(through, from);
  assert(cols.length == 1, "Only supports single-column through joins right now");
  clause = clause.on(cols[0]);
  clause = clause.leftJoin(to);
  cols = find(through, to);
  assert(cols.length == 1, "Only supports single-column through joins right now");
  clause = clause.on(cols[0]);
  return clause;
};

//create entire join query clause
Joiner.prototype.leftJoinTo = function(from, to) {
  var clause = from.select(this.columns(from, to));
  return clause.from(this.leftJoin(from, to));
};

Joiner.prototype.joinTo = function(from, to) {
  var clause = from.select(this.columns(from, to));
  return clause.from(this.join(from, to));
};
