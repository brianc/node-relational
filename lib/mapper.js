var assert = require('assert');
var Joiner = require(__dirname + '/joiner');
//maps between row and model instance
var Mapper = module.exports = function(table) {
  this.table = table;
  this.relationships = [];
};

Mapper.prototype.apply = function(instance, row) {
  for(var key in row) {
    instance[key] = row[key];
  }
};

Mapper.prototype.addRelationship = function(relationship) {
  this.relationships.push(relationship);
};

Mapper.prototype.createScope = function() {
  var table = this.table;
  if(!this.relationships.length) {
    return table.select(table.star());
  }
  assert(this.relationships.length === 1, "only supporting 1 eager relationship now");
  var joiner = new Joiner();
  var other = this.relationships[0].to;
  return joiner.leftJoinTo(table, other);
}

//TODO this method is crap
var areEqual = function(left, right) {
  for(var key in left) {
    if(left[key] != right[key] && typeof left[key] == 'number') {
      return false;
    }
  }
  return true;
};

Mapper.prototype._mapSimpleRow = function(row) {
  //create instance of model
  var instance = {};
  //attach row specific methods
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
    var columns = joiner.columns.apply(joiner, [rel.from, rel.to]);
    for(var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var instance = {};
      var other = {};
      var skipother = false;
      //loop through columns
      for(var j = 0; j < columns.length; j++) {
        var col = columns[j];
        //apply column to other if it 
        //belongs to other table
        if(col.table === this.table) {
          instance[col.name] = row[col.alias];
        } else if(skipother || col.table === rel.to) {
          var otherval = row[col.alias];
          //Do not map association if it has null primary key
          //meaning the left join returned nothing
          if(rel.to[col.name].primaryKey && !otherval) {
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
        //TODO - make this faster
        if(areEqual(result, instance)) {
          isNewInstance = false;
          instance = result;
        }
      }
      if(isNewInstance) {
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
