var assert = require('assert');
var sql = require('sql');
var Schema = require(__dirname + '/../');

var schema = Schema.define({
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

var check = function(actual, expected) {
  var actualQuery = actual.toQuery();
  var expectedQuery = expected.toQuery();
  if(actualQuery.text != expectedQuery.text) {
    console.log('actual:  %s', actualQuery.text);
    console.log('expected: %s', expectedQuery.text);
    assert.equal(actualQuery.text, expectedQuery.text);
  }
};

describe('scope', function() {
  var User = schema.define('user');
})
