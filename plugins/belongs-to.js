//builds a belongsTo dynamic loader
var dynamicLoader = function(other, col) {
  return function(cb) {
    var otherTable = other.table;
    var otherIdColumn = other.table[col.foreignKey.column];
    var q = otherTable.select(otherTable.star());
    var val = this[col.name];
    if(!val) {
      throw new Error("TODO: cannot find parent of unsaved or null ID");
    }
    q.where(otherIdColumn.equals(val))
    return other.execute(this, 'loadParent', q, cb);
  }
};

var dynamicSaver = function(other, col, name) {
  return function(owner, cb) {
    if(!this.isSaved()) {
      //TODO currently cannot add children to unsaved parents
      var msg = ("TODO: cannot add " + other.table.getName() + " instance as '" + name + "' of unsaved " + this.constructor.table.getName());
      return cb(new Error(msg));
    }
    this[col.name] = owner[col.foreignKey.column];
    return this.update(cb);
  }
}

var init = function belongsTo(relational, Ctor) {
  Ctor.belongsTo = function(other, name) {
    for(var i = 0; i < Ctor.table.columns.length; i++) {
      var col = Ctor.table.columns[i];
      if(col.getForeignColumn(other.table)) {
        if(Ctor.prototype['get' + name]) {
          throw new Error("TODO: support multi-column joins");
        }
        Ctor.prototype['get' + name] = dynamicLoader(other, col);
        Ctor.prototype['set' + name] = dynamicSaver(other, col, name);
      }
    }
  };
};

module.exports = init;
