var assert = require('assert');
var util = require('util');
var helper = require(__dirname);
var Mapper = require(__dirname + '/../lib/mapper');
var schema = helper.createSchema();

describe('mapper', function() {
  var User = schema.define('user');

  var testRows = function(mapper, rows, more) {
    before(function() {
      this.result = mapper.map(rows);
    });
    it('returns an array', function() {
      assert(util.isArray(this.result), 'should return an array');
    });

    it('returns ' + rows.length + 'rows', function() {
      assert.equal(this.result.length, rows.length, 'should have 1 item');
    });

    it('returns array of models', function() {
      for(var i = 0; i < this.result; i++) {
        assert(this.result[i] instanceof User, 'item should be a user');
      }
    });

    more.call(this);
  };


  describe('single model single row', function() {
    var row = [{id: 1, email: 'test', role: 2}];
    var mapper = new Mapper(User);

    testRows(mapper, row, function() {
      it('maps user properties', function() {
        var user = this.result[0];
        assert.deepEqual(JSON.stringify(user), JSON.stringify({id: 1, email: 'test', role: 2}));
      });
    });

  });

  describe('single model, many rows', function() {
    var rows = [{id: 1, email: 'test', role: 3},
                {id: 2, email: 'test2', role: 4}]
    var mapper = new Mapper(User);
    testRows(mapper, rows, function() {
      it('maps first user properties', function() {
        var user1 = this.result[0];
        assert.equal(JSON.stringify(user1), JSON.stringify(rows[0]));
      });

      it('maps second user properties', function() {
        var user2 = this.result[1];
        assert.equal(JSON.stringify(user2), JSON.stringify(rows[1]));
      });
    });
  });

  //test situation of 'hasMany' returninig no sub-collection
  describe('nested model - 1 row - empty join set', function() {
    var Photo = schema.define('photo');
    var row = {};
    row["user.id"] = 1;
    row["user.email"] = 'test';
    row["user.role"] = 2;
    var mapper = new Mapper(User);
    mapper.addForeign(Photo);
    testRows(mapper, [row], function() {
      it('maps properties', function() {
        var user = this.result[0];
        assert.equal(user.id, 1, "should have id of 1");
        assert.equal(user.email, 'test');
        assert.equal(user.role, 2);
      });
    });
  });

  describe('nested mode - 1 row - 1 join - 1 join result', function() {
    schema.use('has-many');
    var User = schema.define('user');
    var Photo = schema.define('photo');
    User.hasMany({
      model: Photo,
      name: 'photos',
      eager: true
    });
    var row = {};
    row["user.id"] = 1;
    row["user.email"] = 'test';
    row["user.role"] = 2;
    row["photo.photoId"] = 6;
    row["photo.size"] = 10;
    row["photo.ownerId"] = 1;
    testRows(User.mapper, [row], function() {
      it('maps rows', function() {
        var user = this.result[0];
        assert.equal(user.id, 1, "should have id of 1");
        assert.equal(user.email, 'test');
        assert.equal(user.role, 2);
        assert(user);
        assert(user.photos, 'user should have photos collection');
      });
      it('maps photos to user', false, function() {
        var user = this.result[0];
        assert.equal(user.photos.length, 1);
      });
    });
  });
});
