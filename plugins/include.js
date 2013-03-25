var aliasColumns = function(list, table) {
  for(var i = 0; i < table.columns.length; i++) {
    var col = table.columns[i];
    list.push(col.as(table.getName() + "." + col.name));
  }
};
// include plugin
module.exports = function include(relational, Ctor) {
  var Joiner = require(__dirname + '/../lib/joiner');
  var includes = [];
  Ctor.include = function(config) {
    includes.push(config.model);
  };
  Ctor.find = function(filter, cb) {
    var table = Ctor.table;
    var other = includes[0].table;
    var joinClause = new Joiner().leftJoin(table, other);
    var cols = [];
    aliasColumns(cols, table);
    aliasColumns(cols, other);
    var q = table.select(cols).from(joinClause);
    var q = q.where(filter);
    return Ctor.execute(this, 'find', q, cb);
  };
};
