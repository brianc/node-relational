var helper = require(__dirname);
var assert = require('assert');
var schema = helper.createSchema();

describe('Model', function() {
  describe('has many', function() {
    schema.use('has-many');
    var User = schema.define('user', {

    });
    var Photo = schema.define('photo', {

    });
    Photo.prototype.getSize = function() {
      return this.size;
    };
    User.hasMany({
      model: Photo,
      name: 'photos'
    });

    describe('get', function() {
      it('works', function(done) {
        var user = new User();
        user.id = 1;
        assert.equal(typeof user.getPhotos, 'function');
        schema.db.verify(function(query, cb) {
          var table = Photo.table;
          var expected = table.select(table.star());
          expected.from(User.table.join(table).on(table.ownerId.equals(User.table.id)));
          expected.where(User.table.id.equals(user.id));
          helper.assert.equalQueries(query, expected);
          cb(null, [{
            photoId: 1,
            size: 50,
            ownerId: user.id
          }, {
            photoId: 2,
            size: 10,
            ownerId: user.id
          }])
        });
        var query = user.getPhotos(function(err, photos) {
          assert.ifError(err);
          assert.equal(photos.length, 2);
          var photo = photos.shift();
          assert(photo.isSaved());
          assert.equal(photo.constructor.table, Photo.table, "should have a photo constructor");
          assert.equal(photo.getSize(), 50);
          done();
        });
      });
    });
  });
});
