var helper = require(__dirname);
var assert = require('assert');
var schema = helper.createSchema();

describe('belongs to', function() {
  schema.use('belongs-to');
  var User = schema.define('user', {

  });
  var Photo = schema.define('photo', {

  });
  Photo.belongsTo({
    model: User,
    name: 'owner'
  });


  describe('get', function() {
    it('works', function(done) {
      var photo = new Photo();
      photo.ownerId = 10;
      schema.db.verify(function(query, cb) {
        var expected = User.table.select(User.table.star()).where({id: 10});
        cb(null, [{
          id: 1,
          email: 'test@test.com'
        }]);
      });
      photo.get('owner', function(err, users) {
        assert.ifError(err);
        assert.equal(users.length, 1);
        assert.equal(users[0].id, 1);
        done();
      });
    });
  });
});
