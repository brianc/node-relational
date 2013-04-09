var assert = require('assert');
//builds a belongsTo dynamic loader
var dynamicLoader = function(other, col) {
  var otherTable = other.table;
  var otherIdColumn = other.table[col.foreignKey.column];
  return function(name, cb) {
    var q = otherTable.select(otherTable.star());
    var val = this[col.name];
    if(!val) {
      throw new Error("TODO: cannot find parent of unsaved or null ID");
    }
    q.where(otherIdColumn.equals(val))
    return other.execute({
      query: q,
      callback: cb
    });
  }
};

var init = function belongsTo(relational, Ctor) {
  Ctor.belongsTo = function(config) {
    var model = config.model;
    var name = config.name;
    assert(model, 'must supply foreign model as "model" property to belongsTo');
    Ctor.addRelationship({
      type: 'belongsTo',
      source: Ctor,
      other: model,
      name: name,
      eager: config.eager
    });
    for(var i = 0; i < Ctor.table.columns.length; i++) {
      var col = Ctor.table.columns[i];
      if(col.getForeignColumn(model.table)) {
        assert(!Ctor.getters[name], "Already has a property accessor for " + name);
        Ctor.getters[name] = dynamicLoader(model, col);
        return;
      }
    }
    assert(false, "Was unable to find a belongsTo relationship between " + Ctor.table.getName() + " and " + model.table.getName());
  };
};

module.exports = init;
