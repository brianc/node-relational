var Schema = require(__dirname + '/../');
//in memory fake database
Schema.db = {
  verify: function(doCheck) {
    Schema.db.nextCheck = doCheck;
  },
  check: function(query, cb) {
    throw new Error("need to check query");
  },
  query: function(query, cb) {
    if(Schema.db.nextCheck) {
      Schema.db.nextCheck(query, cb);
      Schema.db.nextCheck = Schema.db.check;
      return;
    }
    Schema.db.check(text, params, cb);
  }
}

var assert = require('assert');
var helper = module.exports = {
  assert: {
    equalQueries: function(actual, expected) {
      var actualQuery = actual.toQuery();
      var expectedQuery = expected.toQuery();
      if(actualQuery.text != expectedQuery.text) {
        console.log("**************");
        console.log('actual:   %s', actualQuery.text);
        console.log('expected: %s', expectedQuery.text);
        console.log("**************");
        assert.equal(actualQuery.text, expectedQuery.text);
      }
    }
  }
};
