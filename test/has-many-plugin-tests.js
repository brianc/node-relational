var helper = require(__dirname);
var assert = require('assert');
var schema = helper.createSchema();

describe('Model', function() {
  describe('has many', function() {
    var hasMany = require(__dirname + '/../plugins/has-many');
    schema.use(hasMany.name, hasMany.action);
    var User = schema.define('user', {

    });
    var Photo = schema.define('photo', {

    });
    Photo.prototype.getSize = function() {
      return this.size;
    };
    User.hasMany(Photo, 'Photos');

    describe('get', function() {
      it('works', function(done) {
        var user = new User();
        user.id = 1;
        assert.equal(typeof user.getPhotos, 'function');
        schema.db.verify(function(query, cb) {
          var table = Photo.table;
          var expected = table.select(table.star());
          expected.from(User.table.join(table).on(User.table.id.equals(table.ownerId)));
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

  describe('belongs to', function() {
    var belongsTo = require(__dirname + '/../plugins/belongs-to');
    schema.use(belongsTo.name, belongsTo.action);
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
});
