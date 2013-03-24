var assert = require('assert');
var helper = require(__dirname);
var relational = require(__dirname + '/../');

var schema = relational.define({
  tables:[{
    name: 'user',
    columns: [{
      name: 'id',
      type: 'serial',
      primaryKey: true,
      readOnly: true
    }, {
      name: 'email',
      type: 'text'
    }, {
      name: 'role',
      type: 'int'
    }]
  }, {
    name: 'photo',
    columns: [{
      name: 'photoId',
      type: 'serial',
      primaryKey: true
    }, {
      name: 'size',
      type: 'int'
    }, {
      name: 'ownerId',
      type: 'int',
      references: {
        table: 'user',
        column: 'id'
      }
    }]
  }]
});

schema.use('include');

describe('include', function() {
  User = schema.define('user');
  it('works')
});
