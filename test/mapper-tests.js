var assert = require('assert');
var util = require('util');
var helper = require(__dirname);
var Mapper = require(__dirname + '/../lib/mapper');
var schema = helper.createSchema();

describe('mapper', function(num) {

  var testRows = function(mapper, rows, more) {
    before(function() {
      this.result = mapper.map(rows);
    });
    it('returns an array', function() {
      assert(util.isArray(this.result), 'should return an array');
    });

    more.call(this);
  };

  var hasResultLength = function(num) {
    it('returns ' + num + 'rows', function() {
      assert.equal(this.result.length, num, 'should have ' + num + ' items in results but has ' + this.result.length);
    });
  };


  describe('single model single row', function() {
    var row = [{id: 1, email: 'test', role: 2}];
    var mapper = new Mapper(schema.getTable('user'));

    testRows(mapper, row, function() {
      hasResultLength(1);
      it('maps user properties', function() {
        var user = this.result[0];
        assert.deepEqual(JSON.stringify(user), JSON.stringify({id: 1, email: 'test', role: 2}));
      });
    });

  });

  describe('single model, many rows', function() {
    var rows = [{id: 1, email: 'test', role: 3},
                {id: 2, email: 'test2', role: 4}]
    var mapper = new Mapper(schema.getTable('user'));
    testRows(mapper, rows, function() {
      hasResultLength(2);
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

  describe('nested model', function() {
    var user = schema.getTable('user');
    schema.addRelationship({
      name: 'photos',
      from: 'user',
      to: 'photo'
    });
    var mapper = new Mapper(user);
    var rel = schema.getRelationship(user, 'photos')
    mapper.addRelationship(rel);

    describe('1 parent - empty join set', function() {
      var row = {};
      row['user.id'] = 1;
      row['user.email'] = 'test';
      row['user.role'] = 2;
      row['photo.photoId'] = null;
      row['photo.size'] = null;
      row['photo.ownerId'] = null;
      testRows(mapper, [row], function() {
        hasResultLength(1);
        it('maps properties', function() {
          var user = this.result[0];
          assert.equal(user.id, 1, "should have id of 1");
          assert.equal(user.email, 'test');
          assert.equal(user.role, 2);
        });

        it('creates empty association', function() {
          var user = this.result[0];
          assert.equal(user.photos.length, 0);
        });
      });
    });

    describe('1 parent - 1 join - 1 join result', function() {
      var row = {};
      row["user.id"] = 1;
      row["user.email"] = 'test';
      row["user.role"] = 2;
      row["photo.photoId"] = 6;
      row["photo.size"] = 10;
      row["photo.ownerId"] = 1;
      testRows(mapper, [row], function() {
        hasResultLength(1);

        it('maps rows', function() {
          var user = this.result[0];
          assert.equal(user.id, 1, "should have id of 1");
          assert.equal(user.email, 'test');
          assert.equal(user.role, 2);
          assert(user);
          assert(user.photos, 'user should have photos collection');
        });

        it('maps photos to user', function() {
          var user = this.result[0];
          assert.equal(user.photos.length, 1);
        });
      });
    });

    describe('1 parent - 1 join - 2 join results', function() {
      var row = {};
      row["user.id"] = 1;
      row["user.email"] = 'test';
      row["user.role"] = 2;
      row["photo.photoId"] = 6;
      row["photo.size"] = 10;
      row["photo.ownerId"] = 1;
      var row2 = {}
      row2["user.id"] = 1;
      row2["user.email"] = 'test';
      row2["user.role"] = 2;
      row2["photo.photoId"] = 9;
      row2["photo.size"] = 10;
      row2["photo.ownerId"] = 1;
      testRows(mapper, [row, row2], function() {
        hasResultLength(1);
        it('maps rows', function() {
          var user = this.result[0];
          assert(user);
          assert.equal(user.id, 1, "should have an id of 1");
          assert.equal(user.email, 'test');
          assert.equal(user.role, 2);
          assert(user.photos, "should have a photos array");
        });

        it('has two children', function() {
          var user = this.result[0];
          assert.equal(user.photos.length, 2);
        });
      });
    });

    describe('2 parent - 1 join - 2 join results', function() {
      var row = {};
      row["user.id"] = 1;
      row["user.email"] = 'test';
      row["user.role"] = 2;
      row["photo.photoId"] = 6;
      row["photo.size"] = 10;
      row["photo.ownerId"] = 1;
      var row2 = {}
      row2["user.id"] = 1;
      row2["user.email"] = 'test';
      row2["user.role"] = 2;
      row2["photo.photoId"] = 9;
      row2["photo.size"] = 10;
      row2["photo.ownerId"] = 1;
      var row3 = {};
      row3["user.id"] = 2;
      row3["user.email"] = 'test2';
      row3["user.role"] = 1;
      row3["photo.photoId"] = 9;
      row3["photo.size"] = 10;
      row3["photo.ownerId"] = 2;
      var row4 = {}
      row4["user.id"] = 2;
      row4["user.email"] = 'test2';
      row4["user.role"] = 1;
      row4["photo.photoId"] = 13;
      row4["photo.size"] = 10;
      row4["photo.ownerId"] = 2;
      testRows(mapper, [row, row2, row3, row4], function() {
        hasResultLength(2);
        it('maps rows', function() {
          var user = this.result[0];
          assert(user);
          assert.equal(user.id, 1, "should have an id of 1");
          assert.equal(user.email, 'test');
          assert.equal(user.role, 2);
          assert(user.photos, "should have a photos array");
        });

        it('has two children', function() {
          var user = this.result[0];
          assert.equal(user.photos.length, 2);
        });
      });
    });
  });
});
