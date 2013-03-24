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

describe('joiner', function() {
  var User = schema.define('user');
  var Photo = schema.define('photo');
  var Joiner = function(schema) {
    this.schema = schema;
  };
  //calculate a join path between 'from' table and 'to' table
  Joiner.prototype.join = function(from, to) {
    var fromCols = from.columns.filter(function(col) {
      return col.references && col.references.table == to.getName();
    });
    assert(fromCols.length <= 1, "Does not support auto-multi-column joins yet");
    var fromCol = fromCols.pop();
    if(fromCol) {
      return from.join(to).on(fromCol.equals(to.getColumn(fromCol.references.column)));
    }
    var toCols = to.columns.filter(function(col) {
      return col.references && col.references.table == from.getName();
    });
    assert(toCols.length <= 1, "Does not support auto-multi-column joins yet");
    var toCol = toCols.pop();
    if(toCol) {
      return from.join(to).on(toCol.equals(from.getColumn(toCol.references.column)));
    }
  };
  it('does simple join', function() {
    var joiner = new Joiner();
    var join = joiner.join(User.table, Photo.table);
    var actual = User.table.from(join);
    var expected = User.table.from(
      User.table.join(Photo.table).on(Photo.table.ownerId.equals(User.table.id))
    );
    helper.assert.equalQueries(actual, expected);
  });

  it('does simple join in other direction', function() {
    var joiner = new Joiner();
    var join = joiner.join(Photo.table, User.table);
    var actual = Photo.table.from(join);
    var expected = Photo.table.from(
      Photo.table.join(User.table).on(Photo.table.ownerId.equals(User.table.id))
    );
    helper.assert.equalQueries(actual, expected);
  });
});

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
      done();
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
  })

  it('can join')//, function(done) {
//    var Photo = schema.define('photo');
//    User.withPhotos = User.createScope({
//      join: User.table.join(Photo.table)
//        .on(User.table.id.equals(Photo.table.ownerId)),
//      where: Photo.table.photoId.isNotNull()
//    });
//});
});
