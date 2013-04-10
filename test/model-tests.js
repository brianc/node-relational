var assert = require('assert');

var relational = require(__dirname + '/../');
var helper = require(__dirname);

var schema = relational.define({
  tables: [{
    name: 'customer',
    columns: [{
      name: 'id',
      type: 'serial',
      primaryKey: true
    }]
  }]
})

describe('model', function() {
  before(function() {
    this.Customer = schema.define('customer');
  });

  it('returns primary key columns', function() {
    var keys = this.Customer.getPrimaryKeys();
    assert(keys);
    assert(keys.length, 1);
    assert.equal(keys[0].name, 'id');
  });
});
