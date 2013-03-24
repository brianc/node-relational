//in memory fake database
module.exports = {
  name: 'mock-database',
  init: function(schema, Ctor) {
    schema.db = {
      verify: function(doCheck) {
        var tid = setTimeout(function() {
          throw new Error('database expected a query but did not get');
        }, 1000)
        schema.db.nextCheck = function() {
          clearTimeout(tid);
          doCheck.apply({}, arguments);
        };

      },
      check: function(query, cb) {
        throw new Error("need to check query");
      },
      query: function(query, cb) {
        if(schema.db.nextCheck) {
          var verify = schema.db.nextCheck;
          schema.db.nextCheck = null;
          verify(query, cb);
          return;
        }
        schema.db.check(query, cb);
      }
    }
  }
};
