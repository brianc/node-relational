//builds a belongsTo dynamic loader
var dynamicLoader = function(other, col) {
  return function(cb) {
    var otherTable = other.table;
    var otherIdColumn = other.table[col.references.column];
    var q = otherTable.select(otherTable.star());
    var val = this[col.name];
    if(!val) {
      throw new Error("TODO: cannot find parent of unsaved or null ID");
    }
    q.where(otherIdColumn.equals(val))
    return other.execute(this, 'loadParent', q, cb);
  }
}

var init = function(relational, Ctor) {
  Ctor.belongsTo = function(other, name) {
    Ctor.table.columns.forEach(function(col) {
      if(col.references && col.references.table == other.table.getName()) {
        Ctor.prototype['get' + name] = dynamicLoader(other, col);
      }
    });
  };
};

module.exports = {
  name: 'belongs-to',
  action: init
}
