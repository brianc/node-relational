var assert = require('assert');
var Mapper = require(__dirname + '/../lib/mapper');

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
    return other.execute({
      query: q,
      callback: cb
    });
  }
};

var throughLoader = function() {
  
};

module.exports = function hasMany(schema, Ctor) {
  Ctor.hasMany = function(config) {
    var model = config.model;
    var name = config.name;
    var conf = {
      type: 'hasMany',
      source: Ctor,
      other: model,
      name: name,
      eager: config.eager
    };
    if(config.through) {
      //add model relationships
      conf.join = config.through;
      conf.join.addRelationship({
        type: 'hasOne',
        source: conf.join,
        name: conf.other.getName(),
        other: conf.other
      });
      conf.other.addRelationship({
        type: 'belongsTo',
        source: conf.other,
        name: conf.join.getName(),
        other: conf.join
      });
      conf.join.addRelationship({
        type: 'hasOne',
        source: conf.join,
        name: conf.source.getName(),
        other: conf.source
      });
    } else {
      Ctor.addRelationship(conf);
    }
    var joiner = new (require(__dirname + '/../lib/joiner'));
    
    //TODO this needs to be refactored like LOL
    if(config.through) {
      //set up joined relationship
      var joinColumns = joiner.columns(conf.join.table, conf.other.table);
      var joinTable = joiner.join(conf.join.table, conf.other.table);
      var mapper = new Mapper(conf.other);
      mapper.addRelationship(conf.other.getRelationship(conf.join));
      var table = conf.join.table;
      var refs = [];
      for(var i = 0; i < table.columns.length; i++) {
        var col = table.columns[i];
        if(col.foreignKey && col.foreignKey.table === Ctor.table.getName()) {
          refs.push(col);
        }
      }
      assert.equal(refs.length, 1, "1 and only 1 foreign key reference is currently supported in has-many-through relationship, but found" + refs.length);
      return Ctor.getters[name] = function(name, cb) {
        var q = conf.join.table.select(joinColumns).from(joinTable);
        //TODO - DO NOT HARD CODE ID COLUMN
        q = q.where(refs[0].equals(this.get(refs[0].foreignKey.column)));
        return conf.other.execute({
          mapper: mapper,
          query: q,
          callback: cb
        });
      };
    };
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


