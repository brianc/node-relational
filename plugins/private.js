module.exports = function private(schema, Ctor) {
  var private = [];
  for(var i = 0; i < Ctor.table.columns.length; i++) {
    var col = Ctor.table.columns[i];
    if(col.private) {
      private.push(col.name);
    }
  }
  //only create custom serializer for models
  //which have private columns
  if(private.length) {
    Ctor.prototype.apply = function(other) {
      for(var i = 0; i < Ctor.table.columns.length; i++) {
        var column = Ctor.table.columns[i];
        if(column.readOnly || column.private) continue;
        this[column.name] = other[column.name];
      }
    };
    Ctor.prototype.toJSON = function() {
      var result = {};
      for(var key in this) {
        if(private.indexOf(key) > -1) continue;
        result[key] = this[key];
      }
      return result;
    };
  }
};
