//builds a hasMany dynamic loader
var dynamicLoader = function(other, col) {
  return function(cb) {
    var table = this.constructor.table;
    var otherTable = other.table;
    var idCol = table[col.foreignKey.column];
    var q = otherTable.select(otherTable.star());
    q.from(table.joinTo(other.table));
    q.where(idCol.equals(this[idCol.name]));
    return other.execute(this, 'loadChildren', q, cb);
  }
}

var upcase = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

module.exports = function hasMany(relational, Ctor) {
  Ctor.hasMany = function(config) {
    var model = config.model;
    var name = config.name;
    Ctor.addRelationship({
      type: 'has-many',
      model: model,
      name: name,
      eager: config.eager
    });
    Ctor.mapper.addForeign(model);
    //find relation in other model
    model.table.columns.forEach(function(col) {
      if(col.foreignKey && col.foreignKey.table == Ctor.table.getName()) {
        Ctor.prototype['get' + upcase(name)] = dynamicLoader(model, col);
      }
    });
  };
}


