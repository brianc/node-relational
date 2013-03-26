var Joiner = require(__dirname + '/joiner');
//maps between row and model instance
var Mapper = module.exports = function(Model) {
  this.Model = Model;
  this.models = [Model];
};

Mapper.prototype.apply = function(instance, row) {
  for(var key in row) {
    instance[key] = row[key];
  }
  return instance;
};

Mapper.prototype.addForeign = function(OtherModel) {
  this.models.push(OtherModel);
};

Mapper.prototype.map = function(rows) {
  var results = [];
  if(!rows) return results;
  //happy-path - no joining
  if(this.models.length === 1) {
    for(var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var instance = new this.models[0]();
      instance.isSaved = function() { return true; };
      instance.getRow = function() { return row; };
      var instance = this.apply(instance, row);
      results.push(instance);
    }
  } else { //join models/tables involved
    var joiner = new Joiner();
    var columns = joiner.columns.apply(joiner, this.models.map(function(Model){return Model.table}));
    for(var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var Model = this.models[0];
      var instance = new Model();
      instance.isSaved = function() { return true; };
      instance.getRow = function() { return row; };
      for(var j = 0; j < columns.length; j++) {
        var col = columns[j];
        if(!col.table === Model.table) continue;
        instance[col.name] = row[col.alias];
      }
      results.push(instance);
    }
  }
  return results;
};
