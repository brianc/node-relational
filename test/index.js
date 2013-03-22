var relational = require(__dirname + '/../');
relational.use('mock-database');
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
