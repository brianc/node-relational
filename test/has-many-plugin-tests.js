var helper = require(__dirname);
var sql = require('sql');
var assert = require('assert');
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

var hasMany = require(__dirname + '/../plugins/has-many');
var belongsTo = require(__dirname + '/../plugins/belongs-to');
relational.register(hasMany.name, hasMany.action);
relational.register(belongsTo.name, belongsTo.action);

var check = helper.assert.equalQueries;

describe('schema', function() {
  it('has tables', function() {
    assert(schema.user instanceof sql.Table);
    assert(schema.photo instanceof sql.Table);
  });
});

var User = schema.define('user', {

});

var Photo = schema.define('photo', {

});

describe('Model', function() {
  Photo.prototype.getSize = function() {
    return this.size;
  };

  User.hasMany(Photo, 'Photos');

  describe('has many', function() {
    describe('get', function() {
      it('works', function(done) {
        var user = new User();
        user.id = 1;
        assert.equal(typeof user.getPhotos, 'function');
        relational.db.verify(function(query, cb) {
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

  Photo.belongsTo(User, 'Owner');
  describe('belongs to', function() {
    describe('get', function() {
      it('works', function(done) {
        var photo = new Photo();
        photo.ownerId = 10;
        assert.equal(typeof photo.getOwner, 'function', 'photo is missing the getOwner function');
        relational.db.verify(function(query, cb) {
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
        relational.db.verify(function(query, cb) {
          cb(null, [{id: 2}]);
        });
        User.insert(user, function(err, user) {
          user = user.pop();
          assert(user.id);
          var photo = new Photo();
          relational.db.verify(function(query, cb) {
            cb(null, [{photoId: 1}]);
          });
          Photo.insert(photo, function(err, photo) {
            photo = photo.pop()
            relational.db.verify(function(query, cb) {
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
