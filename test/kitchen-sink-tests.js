var assert = require('assert');
var helper = require(__dirname);
var Relational = require(__dirname + '/../');
var schema = new Relational().schema;

schema.use('mock-database');
schema.addTable({
  name: 'user',
  columns: [{
    name: 'id',
    type: 'serial',
    primaryKey: true
  }, {
    name: 'email',
    type: 'text'
  }]
});

schema.addTable({
  name: 'userToGroup',
  columns: [{
    name: 'id',
    type: 'serial',
    primaryKey: true
  }, {
    name: 'userId',
    type: 'int',
    foreignKey: {
      table: 'user',
      column: 'id'
    }
  }, {
    name: 'groupId',
    type: 'int',
    foreignKey: {
      table: 'group',
      column: 'id'
    }
  }]
});

schema.addTable({
  name: 'group',
  columns: [{
    name: 'id',
    type: 'serial',
    primaryKey: true
  }, {
    name: 'name',
    type: 'text'
  }]
});

schema.addRelationship({
  name: 'groups',
  from: 'user',
  to: 'group',
  through: 'userToGroup'
});

describe('schema', function() {
  it('works', function() {

    var q = schema
      .find('user')
      .include('groups');
    console.log(q.toQuery().text);
  });
});
