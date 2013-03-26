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
    //find relation in other model
    var found = false;
    for(var i = 0; i < model.table.columns.length; i++) {
      var col = model.table.columns[i];
      if(col.foreignKey && col.foreignKey.table == Ctor.table.getName()) {
        if(config.column && col.name != config.column) continue;
        if(found) {
          throw new Error('TODO found more than 1 foreign key connecting "'+Ctor.table.getName()+'" and "'+model.table.getName()+'", specifiy which in the has-many')
        }
        Ctor.prototype['get' + upcase(name)] = dynamicLoader(model, col);
        found = true;
      }
    }
    if(!found) {
      throw new Error('TODO could not find foreign key between "'+Ctor.table.getName()+'" and "'+model.table.getName()+'"')
    }
  };
}


