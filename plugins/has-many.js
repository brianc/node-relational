//builds a hasMany dynamic loader
var dynamicLoader = function(other, col) {
  return function(cb) {
    var table = this.constructor.table;
    var otherTable = other.table;
    var idCol = table[col.references.column];
    var q = otherTable.select(otherTable.star());
    q.from(table.join(otherTable).on(idCol.equals(col)));
    q.where(idCol.equals(this[idCol.name]));
    return other.execute(this, 'loadChildren', q, cb);
  }
}

var init = function(relational, Ctor) {
  Ctor.hasMany = function(other, name) {
    //find relation in other
    other.table.columns.forEach(function(col) {
      if(col.references && col.references.table == Ctor.table.getName()) {
        Ctor.prototype['get' + name] = dynamicLoader(other, col);
      }
    });
  };
}

module.exports = {
  name: 'has-many',
  action: init
}
