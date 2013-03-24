var helper = require(__dirname);
var assert = require('assert');

describe('has many through', function() {
  var schema = helper.createSchema();

  var hasManyThrough = require(__dirname + '/../plugins/has-many-through');
  schema.use(hasManyThrough.name, hasManyThrough.action);

  var User = schema.define('user');
  var Car = schema.define('car');
  var UserToCar = schema.define('userToCar');
  User.hasManyThrough(Car, UserToCar, 'Cars');

  it('works?', function(done) {
    var user = new User();
    user.id = 1;
    schema.db.verify(function(query, cb) {
      var ut = User.table;
      var jt = UserToCar.table;
      var ct = Car.table;
      var expected = ct.select(ct.star())
      .from(
        ut.join(jt).on(jt.userId.equals(ut.id))
        .join(ct).on(jt.carId.equals(ct.id)))
        .where(ut.id.equals(user.id));
        helper.assert.equalQueries(query, expected)
        cb(null, [{
          "id": 1,
          "model": "honda"
        }, {
          id: 2,
          model: 'truck'
        }])
    });
    user.getCars(function(err, cars) {
      assert.ifError(err);
      assert.equal(cars.length, 2);
      assert.equal(cars[0].constructor.table, Car.table);
      assert.equal(cars[0].id, 1);
      assert.equal(cars[0].model, 'honda');
      return done();
      //TODO: this...
      user.getCars(function(err, cars) {
        assert.ifError(err);
        assert.equal(cars, cars);
        console.log(cars);
        done();
      });
    });
  });
});
