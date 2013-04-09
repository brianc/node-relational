var helper = require(__dirname);
var assert = require('assert');

describe('Model', function() {
  describe('has many', function() {
    describe('get', function() {
      it('works', function(done) {
        var schema = helper.createSchema();
        schema.use('has-many');
        var User = schema.define('user');

        var Photo = schema.define('photo');

        Photo.prototype.getSize = function() {
          return this.size;
        };

        User.hasMany({
          model: Photo,
          name: 'photos'
        });

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

  describe('eager', function() {
    before(function() {
      var schema = this.schema = helper.createSchema();
      schema.use('has-many');
      var User = this.User = schema.define('user');
      var Star = this.Star = schema.define('star');
      var Product = this.Product = schema.define('product');
      User.hasMany({
        name: 'stars',
        model: Star,
        eager: true
      });
    });

    describe('through parent', function() {
      it('fetches properly', function(done) {
        var User = this.User;
        var Star = this.Star;
        this.schema.db.verify(function(query, cb) {
          var Joiner = require(__dirname + '/../lib/joiner');
          var joiner = new Joiner();
          //console.log(query.toQuery());
          var expected = joiner.leftJoinTo(User.table, Star.table).where(User.table.id.equals(1));
          helper.assert.equalQueries(query, expected);
          assert.equal(query.toQuery().values[0], 1);
          var row = {};
          row["user.id"] = 1;
          row["star.userId"] = 1;
          row["star.productId"] = 2;
          cb(null, [row]);
        });
        User.where({id: 1}).execute(function(err, users) {
          assert.ifError(err);
          assert.equal(users.length, 1, "should return 1 user");
          var user = users.pop();
          assert.equal(user.id, 1);
          user.get('stars', function(err, stars) {
            assert.ifError(err);
            assert(stars, 'should return stars collection');
            assert.equal(stars.length, 1, 'should return 1 star');
            done();
          });
        });
      });
    });
  });
});
