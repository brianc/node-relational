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
        schema.db.verify(function(query, cb) {
          var table = Photo.table;
          var expected = table.select(table.star());
          expected.where(table.ownerId.equals(user.id));
          helper.assert.equalQueries(query, expected);
          assert.equal(expected.toQuery().values[0], 1);
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
        var query = user.get('photos', function(err, photos) {
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

  describe('with two foreign keys', function() {
    var relational = require(__dirname + '/../');
    var schema = relational.define({
      tables: [{
        name: 'user',
        columns: [{
          name: 'id'
        }]
      }, {
        name: 'friendship',
        columns: [{
          name: 'userId',
          foreignKey: {
            table: 'user',
            column: 'id'
          }
        }, {
          name: 'otherUserId',
          foreignKey: {
            table: 'user',
            column: 'id'
          }
        }]
      }]
    });
    schema.use('has-many');
    var User = schema.define('user');
    var Friendship = schema.define('friendship');
    describe('without a column specification', function() {
      it('throws', function() {
        assert.throws(function() {
          User.hasMany({
            model: Friendship,
            name: 'friends'
          });
        });
      });
    });

    it('with a column specification', function() {
      it('does not throw', function() {
        User.hasMany({
          model: Friendship,
          name: 'friendships',
          column: 'userId'
        });
      });
    });
  });
});
