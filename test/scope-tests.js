var assert = require('assert');
var helper = require(__dirname);
var relational = require(__dirname + '/../');

var schema = helper.createSchema();

describe('scope', function() {
  schema.use('mock-database');
  schema.use('scope');
  var User = schema.define('user');
  var Photo = schema.define('photo');


  User.role = {
    normal: 0,
    admin: 1
  };
  User.prototype.isAdmin = function() {
    return this.role == User.role.admin;
  }

  User.administrators = User.createScope({
    where: User.table.role.equals(User.role.admin)
  });

  it('works', function(done) {
    schema.db.verify(function(query, cb) {
      var expected = User.table.select(User.table.star()).where(User.table.role.equals(User.role.admin));
      helper.assert.equalQueries(query, expected);
      cb(null, [{
        id: 2,
        role: 1
      }]);
    });
    User.administrators(function(err, users) {
      done();
    });
  });

  it('is chainable', function(done) {
    schema.db.verify(function(query, cb) {
      var expected = User.table
      .select(User.table.star())
      .where(User.table.role.equals(User.role.admin))
      .and(User.table.id.equals(1));
      helper.assert.equalQueries(query, expected);
      cb(null, [{
        id: 2,
        role: 1
      }]);
    });
    User
    .administrators()
    .where(User.table.id.equals(1))
    .execute(function(cb, users) {
      assert.ifError(cb);
      assert(users.length, 1);
      var user = users.pop()
      assert(user.constructor.table === User.table, "user should have a User table");
      schema.db.verify(function(query, cb) {
        var expected = User.table.select(User.table.star()).where(User.table.role.equals(User.role.admin));
        helper.assert.equalQueries(query, expected);
        cb(null, [{
          id: 2,
          role: 1
        }]);
      });
      User.administrators(function(err, users) {
        done();
      });
    });

  });

  it('can take extra params', function(done) {
    User.inRole = User.createScope(function(role, other) {
      return {
        where: User.table.role.equals(role).or(User.table.role.equals(other))
      }
    });
    schema.db.verify(function(query, cb) {
      var expected = User.table.where({role: 1}).or(User.table.role.equals(2));
      expected.select(User.table.star());
      helper.assert.equalQueries(query, expected);
      cb(null, null);
    });
    User.inRole(1, 2, function() {
      done();
    });
  });

  it('can join', false, function(done) {
  });
});
