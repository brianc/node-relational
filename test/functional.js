var assert = require('assert');
var relational = require(__dirname + '/../');
var helper = require(__dirname);
var check = helper.assert.equalQueries;

var schema = relational.define({
  tables:[{
    name: 'user',
    columns: [{
      name: 'id',
      type: 'serial',
      readOnly: true,
      primaryKey: true
    }, {
      name: 'email',
      type: 'text'
    }, {
      name: 'encryptedPassword',
      private: true,
    }, {
      name: 'salt',
      private: true
    }]
  }]
});

var User = schema.define('user', {

});

describe('CRUD', function() {
  describe('no datatabase', function() {
    it('Create', function() {
      var user = new User();
      user.email = 'test@example.com';
      var sql = User.insert(user);
      var expected = User.table.insert({email: user.email, encryptedPassword: null, salt: null}).returning('*');
      check(sql, expected);
    });
  });

  describe('with fake database', function() {
    it('insert', function(done) {
      relational.db.verify(function(query, cb) {
        var expectedFields = {email: 'omg', encryptedPassword: 'asdf', salt: '1234'};
        var expected = schema.user.insert(expectedFields).returning('*');
        check(query, expected);
        var params = query.toQuery().values;
        cb(null, [{
          id: 1, 
          email: 'omg',
          encryptedPassword: params[1],
          salt: params[2]
        }]);
      });
      var user = new User();
      assert.equal(user.isSaved(), false);
      user.id = 1000;
      user.email = 'omg';
      user.password = 'test';
      user.encryptedPassword = 'asdf';
      user.salt = '1234';
      User.insert(user, function(err, users) {
        assert.equal(users.length, 1);
        var user = users[0];
        assert(user);
        assert.strictEqual(user.id, 1);
        assert.equal(user.email, 'omg', 'email mismatch ' + user.email + ' != ' + 'omg');
        assert.equal(user.encryptedPassword, 'asdf');
        assert.equal(user.password, null);
        assert.equal(user.salt, '1234');
        //removes private properties from json
        assert.equal(JSON.stringify(user), JSON.stringify({id: 1, email: 'omg'}));
        this.user = user;
        done();
      }.bind(this));
    });

    it('updates', function(done) {
      var user = this.user;
      assert.equal(user.isSaved(), true);
      user.email = 'boom@test.com';
      relational.db.verify(function(query, cb) {
        var changes = {email: 'boom@test.com', encryptedPassword: null, salt: null};
        var expected = User.table.update(changes).where({id: 1}).returning('*');
        helper.assert.equalQueries(query, expected);
        cb(null, [{
          id: 1,
          email: 'boom@test.com',
          encryptedPassword: null,
          salt: null
        }]);
      });
      user.update(function(err, users) {
        assert.equal(users.length, 1);
        var user = users[0];
        assert.equal(user.email, 'boom@test.com');
        done();
      });
    });

    describe('destroy', function() {
      it('works', function(done) {
        var user = new User();
        user.email = 'test@test.com';
        relational.db.verify(function(row, cb) {
          cb(null, [{id: 2, email: user.email}]);
        });
        User.insert(user, function(err, user) {
          relational.db.verify(function(query, cb) {
            var expected = User.table.delete({id: 2});
            var params = query.toQuery().values;
            assert.strictEqual(params[0], 2);
            cb(null, []);
          });
          user[0].destroy(function(err) {
            done(err);
          });
        });
      });
    });
  });

  describe('finders', function() {
    it('finds simple', function(done) {
      relational.db.verify(function(query, cb) {
        cb(null, [{
          id: 1,
          email: 'brian',
          encryptedPassword: 'x',
          salt: 'y'
        }, {
          id: 2,
          email: 'brian',
          encryptedPassword: 'z',
          salt: '1'
        }])
      });
      User.find({email: 'brian'}, function(err, users) {
        assert.ifError(err);
        assert.equal(users.length, 2);
        assert.equal(users[0].id, 1);
        assert.equal(users[1].id, 2);
        done();
      });
    });
  });
});
