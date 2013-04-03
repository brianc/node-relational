var assert = require('assert');
var Relational = require(__dirname + '/../');
var schema = new Relational();

describe('User model', function() {
  var User = schema.model({
    name: 'user', //table name
    columns: [{
      name: 'id',
      type: 'serial',
      primaryKey: true
    }, {
      name: 'email',
      type: 'text'
    }]
  });

  var Org = schema.model({
    name: 'org',
    columns: [{
      name: 'orgId',
      type: 'serial',
      primaryKey: true
    }, {
      name: 'name',
      type: 'text'
    }]
  });

  var Membership = schema.model({
    name: 'membership',
    columns: [{
      name: 'id',
      type: 'serial',
      primaryKey: true
    }, {
      name: 'userId',
      type: 'int',
      foreignKey: {
        table: 'user',
        column: 'id'
      }
    }, {
      name: 'orgId',
      type: 'int',
      foreignKey: {
        table: 'org',
        column: 'orgId'
      }
    }],
    belongsTo: [{
      name: 'member',
      table: 'user',
      column: 'id'
    }, {
      name: 'org',
      table: 'org',
      column: 'orgId'
    }]
  });

  describe('tables', function() {
    var hasPrimaryKey = function(table, name, more) {
      it('has primaryKey column ' + name, function() {
        var col = table.getColumn(name);
        assert(col, "should have id");
        assert(col.primaryKey, "column should be primary key");
        assert.equal(col.type, 'serial');
        if(!more) return;
        more();
      });
    }
    describe('user table', function() {
      it('has table', function() {
        assert(User.table);
      });
      hasPrimaryKey(User.table, 'id');
      it('has email column', function() {
        var col = User.table.getColumn('email');
        assert(col, 'should have column email');
        assert.equal(col.type, 'text');
      });
    });

    describe('org table', function() {
      it('exists', function() {
        assert(Org.table);
      });
      hasPrimaryKey(Org.table, 'orgId');
      describe('relationships', function() {
        it('has membership relationship', false, function() {
          assert(Org.getRelationship(Membership));
        });
        it('has orgs relationship', function() {
          
        })
      });
    });
  });

  it('can be instantiated', function() {
    assert(new User(), "should return instance");
    var user = new User();
    assert(user instanceof User, "instance should be instance of class")
  });

});
