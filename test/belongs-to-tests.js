var helper = require(__dirname);
var assert = require('assert');
var schema = helper.createSchema();

describe('belongs to', function() {
  schema.use('belongs-to');
  var User = schema.define('user', {

  });
  var Photo = schema.define('photo', {

  });
  Photo.belongsTo(User, 'Owner');


  describe('get', function() {
    it('works', function(done) {
      var photo = new Photo();
      photo.ownerId = 10;
      assert.equal(typeof photo.getOwner, 'function', 'photo is missing the getOwner function');
      schema.db.verify(function(query, cb) {
        var expected = User.table.select(User.table.star()).where({id: 10});
        cb(null, [{
          id: 1,
          email: 'test@test.com'
        }]);
      });
      photo.getOwner(function(err, users) {
        assert.ifError(err);
        assert.equal(users.length, 1);
        assert.equal(users[0].id, 1);
        done();
      });
    });
  });

  describe('set', function() {
    it('works', function(done) {
      var user = new User();
      schema.db.verify(function(query, cb) {
        cb(null, [{id: 2}]);
      });
      User.insert(user, function(err, user) {
        user = user.pop();
        assert(user.id);
        var photo = new Photo();
        schema.db.verify(function(query, cb) {
          cb(null, [{photoId: 1}]);
        });
        Photo.insert(photo, function(err, photo) {
          photo = photo.pop()
          schema.db.verify(function(query, cb) {
            var expected = Photo.table.update({size: 1, ownerId: 2}).where({photoId: 1}).returning('*');
            helper.assert.equalQueries(query, expected);
            cb(null, [{}]);
          })
          photo.setOwner(user, function(err, photo) {
            done();
          });
        });
      });
    })
  });
});
