var assert = require('assert');
var helper = require(__dirname);
var relational = require(__dirname + '/../');
var schema = helper.createSchema();


describe('joiner', function() {
  var User = schema.define('user');
  var Photo = schema.define('photo');
  var Joiner = require(__dirname + '/../lib/joiner');

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

  it('does left join', function() {
    var joiner = new Joiner();
    var join = joiner.leftJoin(User.table, Photo.table);
    var actual = User.table.from(join);
    var expected = User.table.from(
      User.table.leftJoin(Photo.table).on(Photo.table.ownerId.equals(User.table.id))
    );
    helper.assert.equalQueries(actual, expected);
  });

  it('gets unique list of column names', function() {
    var joiner = new Joiner();
    var cols = joiner.columns(User.table, Photo.table);
    var query = User.table.select(cols);
    var ut = User.table;
    var pt = Photo.table;
    var expected = User.table.select(
      ut.id.as('user.id'),
      ut.email.as('user.email'),
      ut.role.as('user.role'),
      pt.photoId.as('photo.photoId'),
      pt.size.as('photo.size'),
      pt.ownerId.as('photo.ownerId')
    );
    helper.assert.equalQueries(query, expected);
  });
});
