var assert = require('assert');
var helper = require(__dirname);
var relational = require(__dirname + '/../');
var Joiner = require(__dirname + '/../lib/joiner');

var schema = helper.createSchema();

describe('include', function() {
  describe('including without a relationship', function() {
    schema.use('include');
    schema.use('mock-database');
    User = schema.define('user');
    Photo = schema.define('photo');
    User.include({
      model: Photo,
      property: 'photos'
    });

    it('includes when fetching single row', false, function(done) {
      schema.db.verify(function(query, cb) {
        var ut = User.table;
        var pt = Photo.table;
        var expected = ut.select(new Joiner().columns(ut, pt));
        expected.from(ut.leftJoin(pt).on(pt.ownerId.equals(ut.id)));
        expected.where(ut.id.equals(1));
        helper.assert.equalQueries(query, expected);
        console.log(query.toQuery().text);
        var result = [{}, {}];
        var row = result[0];
        row["user.id"] = 1;
        row["user.email"] = 'brian@example.com';
        row["user.role"] = 1;
        row["photo.photoId"] = 2;
        row["photo.ownerId"] = 1;
        row["photo.size"] = 50;
        row = result[1];
        row["user.id"] = 1;
        row["user.email"] = 'brian@example.com';
        row["user.role"] = 1;
        row["photo.photoId"] = 3;
        row["photo.ownerId"] = 1;
        row["photo.size"] = 53;
        cb(null, result);
      });
      User.where(User.table.id.equals(1), function(err, users) {
        assert.equal(users.length, 1, "should have 1 mapped user but found " + users.length);
        var user = users.pop();
        assert.equal(user.id, 1, "user should have id 1");
        done();
      });
    });
    it('works with two tables with same column names');
  });
});
