var assert = require('assert');
var Joiner = require(__dirname + '/joiner');
//maps between row and model instance
var Mapper = module.exports = function(Model) {
  this.Model = Model;
  this.relationships = [];
};

Mapper.prototype.apply = function(instance, row) {
  for(var key in row) {
    instance[key] = row[key];
  }
  return instance;
};

Mapper.prototype.addRelationship = function(relationship) {
  this.relationships.push(relationship);
};

var isSaved = function() {
  return true;
};

Mapper.prototype.map = function(rows) {
  var results = [];
  if(!rows) return results;
  //if there is only one model
  //we don't need to join
  if(this.relationships.length === 0) {
    for(var i = 0; i < rows.length; i++) {
      var row = rows[i];
      //create instance of model
      var instance = new this.Model();
      //attach instance specific methods
      instance.isSaved = isSaved;
      instance.getRow = function() { return row; };
      var instance = this.apply(instance, row);
      results.push(instance);
    }
  } else { 
    assert.equal(this.relationships.length, 1, "Only 1 or 0 relationships can currently be mapped");
    var rel = this.relationships[0];
    var joiner = new Joiner();
    //calculate column aliases used in join
    var columns = joiner.columns.apply(joiner, rel.getTables());
    for(var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var Model = this.Model;
      var instance = new Model();
      var other = new rel.target;
      //apply the instance specific isSaved methods
      instance.isSaved = isSaved;
      other.isSaved = isSaved;
      
      //add relationship property
      instance[rel.name] = [];
      instance[rel.name].push(other);
      //loop through columns
      for(var j = 0; j < columns.length; j++) {
        var col = columns[j];
        //apply column to target if it 
        //belongs to target table
        if(col.table === Model.table) {
          instance[col.name] = row[col.alias];
        } else if(col.table === rel.target.table) {
          other[col.name] = row[col.alias];
        } else {
          throw new Error("Found unknown column " + col.alias);
        }
      }
      results.push(instance);
    }
  }
  return results;
};
