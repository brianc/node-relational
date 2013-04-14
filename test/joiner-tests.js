var assert = require('assert');
var helper = require(__dirname);
var relational = require(__dirname + '/../');
var schema = helper.createSchema();


describe('joiner', function() {
  var user = schema.getTable('user');
  var photo = schema.getTable('photo');
  var Joiner = require(__dirname + '/../lib/joiner');

  it('does simple join', function() {
    var joiner = new Joiner();
    var join = joiner.join(user, photo);
    var actual = user.from(join);
    var expected = user.from(
      user.join(photo).on(photo.ownerId.equals(user.id))
    );
    helper.assert.equalQueries(actual, expected);
  });

  it('does simple join in other direction', function() {
    var joiner = new Joiner();
    var join = joiner.join(photo, user);
    var actual = photo.from(join);
    var expected = photo.from(
      photo.join(user).on(photo.ownerId.equals(user.id))
    );
    helper.assert.equalQueries(actual, expected);
  });

  it('does left join', function() {
    var joiner = new Joiner();
    var join = joiner.leftJoin(user, photo);
    var actual = user.from(join);
    var expected = user.from(
      user.leftJoin(photo).on(photo.ownerId.equals(user.id))
    );
    helper.assert.equalQueries(actual, expected);
  });

  it('gets unique list of column names', function() {
    var joiner = new Joiner();
    var cols = joiner.columns(user, photo);
    var query = user.select(cols);
    var ut = user;
    var pt = photo;
    var expected = user.select(
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
