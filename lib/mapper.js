var assert = require('assert');
var Joiner = require(__dirname + '/joiner');
//maps between row and model instance
var Mapper = module.exports = function(Model) {
  this.Model = Model;
  this.relationships = [];
};

Mapper.prototype.apply = function(instance, row) {
  for(var key in row) {
    instance.$set(key, row[key]);
  }
};

Mapper.prototype.addRelationship = function(relationship) {
  this.relationships.push(relationship);
};

Mapper.prototype.createScope = function() {
  var table = this.Model.table;
  if(!this.relationships.length) {
    return table.select(table.star());
  }
  assert(this.relationships.length === 1, "only supporting 1 eager relationship now");
  var joiner = new Joiner();
  var other = this.relationships[0].other;
  return joiner.leftJoinTo(table, other.table);
}

var isSaved = function() {
  return true;
};

Mapper.prototype._mapSimpleRow = function(row) {
  //create instance of model
  var instance = new this.Model();
  //attach instance specific methods
  instance.isSaved = isSaved;
  instance.getRow = function() { return row; };
  this.apply(instance, row);
  return instance;
};

Mapper.prototype.map = function(rows) {
  var results = [];
  if(!rows) return results;
  //if there is only one model
  //we don't need to join
  if(this.relationships.length === 0) {
    for(var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var instance = this._mapSimpleRow(row);
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
      var instance = new this.Model();
      var other = new rel.other;
      var skipother = false;
      //loop through columns
      for(var j = 0; j < columns.length; j++) {
        var col = columns[j];
        //apply column to other if it 
        //belongs to other table
        if(col.table === this.Model.table) {
          instance[col.name] = row[col.alias];
        } else if(skipother || col.table === rel.other.table) {
          var otherval = row[col.alias];
          //Do not map association if it has null primary key
          //meaning the left join returned nothing
          if(rel.other.table[col.name].primaryKey && !otherval) {
            skipother = true;
          } else{
            other[col.name] = row[col.alias];
          }
        } else {
          throw new Error("Found unknown column " + col.alias);
        }
      }
      var isNewInstance = true;
      //see if instance already exists in result
      for(var k = 0; k < results.length; k++) {
        var result = results[k];
        if(result.equals(instance)) {
          isNewInstance = false;
          instance = result;
        }
      }
      other.isSaved = isSaved;
      if(isNewInstance) {
        //apply the instance specific isSaved methods
        instance.isSaved = isSaved;
        //add relationship property
        instance[rel.name] = [];
        results.push(instance);
      }
      if(!skipother) {
        instance[rel.name].push(other);
      }
    }
  }
  return results;
};
