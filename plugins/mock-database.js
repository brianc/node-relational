var count = 0;
var MockDatabase = function() {
  this.id = ++count;
};

MockDatabase.prototype.verify = function(doCheck) {
  var tid = setTimeout(function() {
    throw new Error('database expected a query but did not get');
  }, 1000)
  this.nextCheck = function() {
    var args = arguments;
    clearTimeout(tid);
    process.nextTick(function() {
      doCheck.apply({}, args);
    });
  };
};

MockDatabase.prototype.check = function() {
  throw new Error("Did not add a verify call before running a query");
};

MockDatabase.prototype.query = function(query, cb) {
  if(this.nextCheck) {
    var verify = this.nextCheck;
    this.nextCheck = null;
    verify(query, cb);
    return;
  }
  this.check(query, cb);
};

//in memory fake database
module.exports = function mockDatabase(schema, Ctor) {
  if(schema.db) {
    return;
  }
  schema.db = new MockDatabase();
};
