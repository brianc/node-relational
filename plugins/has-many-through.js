var buildGetter = function(Ctor, other, join) {
  var id = otherId = thisJoinId = otherJoinId = null;
  for(var i = 0; i < join.table.columns.length; i++) {
    var joinCol = join.table.columns[i];
    if(joinCol.references) {
      if(joinCol.references.table == Ctor.table.getName()) {
        id = Ctor.table[joinCol.references.column];
        thisJoinId = joinCol;
      } else if (joinCol.references.table == other.table.getName()) {
        otherId = other.table[joinCol.references.column];
        otherJoinId = joinCol;
      }
    }
  }
  if(!(id && otherId && thisJoinId && otherJoinId)) {
    console.log('id', (id||0).name);
    console.log('otherId', (otherId||0).name);
    console.log('thisJoinId', (thisJoinId||0).name);
    console.log('otherJoinId', (otherJoinId||0).name);
    throw new Error("TODO: handle missing join column errors");
  }
  return function(cb) {
    var constructor = this.constructor;
    var table = this.constructor.table;
    var otherTable = other.table;
    var joinTable = join.table;
    var q = otherTable.select(otherTable.star());
    var joinClause = table.join(joinTable).on(id.equals(thisJoinId));
    joinClause = joinClause.join(otherTable).on(otherJoinId.equals(otherId));
    q.from(joinClause);
    q.where(table.id.equals(this.id));
    return other.execute(this, 'loadNestedChildren', q, cb);
  };
}

module.exports = {
  name: 'has-many-through',
  action: function(relational, Ctor) {
    Ctor.hasManyThrough = function(other, join, name) {
      Ctor.prototype['get' + name] = buildGetter(Ctor, other, join);
    };
  }
}
