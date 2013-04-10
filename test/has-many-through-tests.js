var helper = require(__dirname);
var assert = require('assert');

describe('has many through', function() {
  it('works?', function(done) {
    var schema = helper.createSchema();

    schema.use('has-many');

    var User = schema.define('user');
    var Car = schema.define('car');
    var UserToCar = schema.define('userToCar');
    User.hasMany({
      name: 'cars',
      model: Car,
      through: UserToCar
    });

    var user = new User();
    user.id = 1;
    schema.db.verify(function(query, cb) {
      var jt = UserToCar.table;
      var ct = Car.table;
      var Joiner = require(__dirname + '/../lib/joiner');
      var joiner = new Joiner();
      var expected = joiner.joinTo(jt, ct).where(jt.userId.equals(user.id));
      helper.assert.equalQueries(query, expected);
      var rows = [];
      var row = {};
      row['car.id'] = 1;
      row['car.model'] = 'honda';
      row["userToCar.id"] = 1;
      row["userToCar.carId"] = 1;
      row["userToCar.userId"] = 2;
      rows.push(row);
      cb(null, rows);
    });
    user.get('cars', function(err, cars) {
      assert.ifError(err);
      assert.equal(cars.length, 1, "should have 1 car but got " + cars.length);
      var car = cars[0];
      assert.equal(cars[0].constructor.table, Car.table, "should have received a car but got a " + car.constructor.table.getName());
      assert.equal(cars[0].id, 1);
      assert.equal(cars[0].model, 'honda');
      return done();
    });
  });
});
