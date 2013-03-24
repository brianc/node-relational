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
      throw new Error("TODO: cannot add " + other.table.getName() + " instance as '" + name + "' of unsaved " + this.constructor.table.getName());
    }
    this[col.name] = owner[col.foreignKey.column];
    return this.update(cb);
  }
}

var init = function(relational, Ctor) {
  Ctor.belongsTo = function(other, name) {
    Ctor.table.columns.forEach(function(col) {
      if(col.foreignKey && col.foreignKey.table == other.table.getName()) {
        Ctor.prototype['get' + name] = dynamicLoader(other, col);
      }
    });
    Ctor.table.columns.forEach(function(col) {
      if(col.foreignKey && col.foreignKey.table == other.table.getName()) {
        Ctor.prototype['set' + name] = dynamicSaver(other, col, name);
      }
    });
  };
};

module.exports = {
  name: 'belongs-to',
  action: init
}
