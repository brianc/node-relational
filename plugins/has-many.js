//builds a hasMany dynamic loader
var dynamicLoader = function(Ctor, other, col) {
  var table = Ctor.table;
  var otherTable = other.table;
  var idCol = table[col.foreignKey.column];
  return function(name, cb) {
    if(this[name]) {
      var self = this;
      return process.nextTick(function() {
        cb(null, self[name]);
      });
    }
    var q = otherTable.select(otherTable.star());
    q.where(col.equals(this.get(idCol.name)));
    return other.execute(this, 'loadChildren', q, cb);
  }
}

var upcase = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

module.exports = function hasMany(schema, Ctor) {
  Ctor.hasMany = function(config) {
    var model = config.model;
    var name = config.name;
    Ctor.addRelationship({
      type: 'hasMany',
      source: Ctor,
      other: model,
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
        Ctor.getters[name] = dynamicLoader(Ctor, model, col);
        found = true;
      }
    }
    if(!found) {
      throw new Error('TODO could not find foreign key between "'+Ctor.table.getName()+'" and "'+model.table.getName()+'"')
    }
  };
}


