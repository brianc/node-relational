var assert = require('assert');
var helper = require(__dirname);
var relational = require(__dirname + '/../');
var schema = relational.define({
  tables: [{
    name: 'user',
    columns: [{
      name: 'id'
    }, {
      name: 'encryptedPassword',
      private: true
    }]
  }, {
    name: 'photo',
    columns: [{
      name: 'userId'
    }, {
      name: 'location',
      private: true
    }]
  }]
});

describe('private', function() {
  describe('before applied', function() {
    var User = schema.define('user');
    it('all fields visible', function() {
      var user = new User();
      user.id = 1;
      user.encryptedPassword = 'test';
      assert.strictEqual(JSON.stringify(user), JSON.stringify({id: 1, encryptedPassword: 'test'}));
    });
  });
  describe('after applied', function() {
    schema.use('private');
    var User = schema.define('user');
    it('hides private fields', function() {
      var user = new User();
      user.id = 1;
      user.encryptedPassword = 'asdf';
      assert.strictEqual(JSON.stringify(user), JSON.stringify({id: 1}));
    });
    it('allows attached properties', function() {
      var user = new User();
      user.id = 1;
      user.encryptedPassword = 'asdf';
      user.profile = {
        name: 'brian',
        status: 'married'
      };
      assert.strictEqual(JSON.stringify(user), JSON.stringify({id: 1, profile: {name: 'brian', status: 'married'}}));
    });

    it('does not serialize private properties of child collections', function() {
      var user = new User();
      var Photo = schema.define('photo');
      var photo = new Photo();
      user.id = 1;
      photo.userId = 2;
      photo.location = 'secret';
      user.photos = [photo];
      assert.strictEqual(JSON.stringify(user), JSON.stringify({id:1,photos:[{userId: 2}]}));
    });
  });
});
