var relational = require(__dirname + '/../');
relational.use('mock-database');
var assert = require('assert');
var helper = module.exports = {
  assert: {
    equalQueries: function(actual, expected) {
      var actualQuery = actual.toQuery();
      var expectedQuery = expected.toQuery();
      if(actualQuery.text != expectedQuery.text) {
        console.log("**************");
        console.log('actual:   %s', actualQuery.text);
        console.log('expected: %s', expectedQuery.text);
        console.log("**************");
        assert.equal(actualQuery.text, expectedQuery.text);
      }
    }
  }
};

helper.createSchema = function() {
  return relational.define({
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
        foreignKey: {
          table: 'user',
          column: 'id'
        }
      }]
    }, {
      name: 'userToCar', //join table connecting User to Car in a "Has Many Through" type of connection
      columns: [{
        name: 'id',
        type: 'serial',
        primaryKey: true,
        readOnly: true
      }, {
        name: 'userId',
        type: 'int',
        foreignKey: {
          table: 'user',
          column: 'id'
        }
      }, {
        name: 'carId',
        type: 'int',
        foreignKey: {
          table: 'car',
          column: 'id'
        }
      }, {
        name: 'created',
        type: 'timestamptz',
        readOnly: true,
        default: 'NOW()'
      }]
    }, {
      name: 'car',
      columns: [{
        name: 'id',
        type: 'serial',
        primaryKey: true,
        readOnly: true
      }, {
        name: 'model',
        type: 'int'
      }]
    }]
  })
}
