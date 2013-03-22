//in memory fake database
module.exports = {
  name: 'mock-database',
  init: function(relational, Ctor) {
    relational.db = {
      verify: function(doCheck) {
        var tid = setTimeout(function() {
          throw new Error('database expected a query but did not get');
        }, 1000)
        relational.db.nextCheck = function() {
          clearTimeout(tid);
          doCheck.apply({}, arguments);
        };

      },
      check: function(query, cb) {
        throw new Error("need to check query");
      },
      query: function(query, cb) {
        if(relational.db.nextCheck) {
          var verify = relational.db.nextCheck;
          relational.db.nextCheck = null;
          verify(query, cb);
          return;
        }
        relational.db.check(query, cb);
      }
    }
  }
};
