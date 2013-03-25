module.exports = {
  name: 'private',
  init: function(schema, Ctor) {
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
      Ctor.prototype.toJSON = function() {
        var result = {};
        for(var key in this) {
          if(private.indexOf(key) > -1) continue;
          result[key] = this[key];
        }
        return result;
      };
    }
  }
}
