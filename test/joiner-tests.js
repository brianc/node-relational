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
});
