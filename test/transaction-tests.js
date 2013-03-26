var helper = require(__dirname);
var assert = require('assert');
var schema = helper.createSchema();
schema.use('transactions', function(schema, Ctor) {
  Ctor.createTransaction = function(cb) {
    Ctor._transaction = schema.db.begin(function(err) {

    });
  };
});

describe('transaction', function() {
  it('works', false, function() {
    User.createTransaction(function(err, tran) {
      User.insert({email: 'test@test.com'}, function(err, cb) {
        tran.commit();
      });
    });
  });
});
