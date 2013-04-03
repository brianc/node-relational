var assert = require('assert');
var util = require('util');
var helper = require(__dirname);
var Mapper = require(__dirname + '/../lib/mapper');
var schema = helper.createSchema();

describe('Properties', function() {
  var User = schema.define('user');
  describe('simple accessors', function() {
    beforeEach(function() {
      this.user = new User();
      this.user.id = 1;
      this.user.email = 'test@example.com';
      this.user.role = 2;
    });

    it('access properties', function() {
      assert.equal(this.user.id, 1);
      assert.equal(this.user.email, 'test@example.com');
      assert.equal(this.user.role, 2);
    });

    it('access by getters', function() {
      assert.equal(this.user.get('id'), 1);
      assert.equal(this.user.get('email'), 'test@example.com');
      assert.equal(this.user.get('role'), 2);
    });

    it('sets with setter', function() {
      this.user.set('id', 2);
      assert.equal(this.user.id, 2);
      assert.equal(this.user.get('id'), 2);
    });
  });
});
