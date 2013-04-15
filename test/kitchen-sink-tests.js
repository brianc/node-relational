var assert = require('assert');
var ok = require('okay');
var helper = require(__dirname);
var Relational = require(__dirname + '/../');
var schema = new Relational().schema;

schema.use('mock-database');
schema.addTable({
  name: 'user',
  columns: [{
    name: 'id',
    type: 'serial',
    primaryKey: true
  }, {
    name: 'email',
    type: 'text'
  }]
});

schema.addTable({
  name: 'userToGroup',
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
    name: 'groupId',
    type: 'int',
    foreignKey: {
      table: 'group',
      column: 'id'
    }
  }]
});

schema.addTable({
  name: 'group',
  columns: [{
    name: 'id',
    type: 'serial',
    primaryKey: true
  }, {
    name: 'name',
    type: 'text'
  }]
});

schema.addTable({
  name: 'meeting',
  columns: [{
    name: 'id',
    type: 'serial',
    primaryKey: true
  },{
    name: 'groupId',
    type: 'int',
    foreignKey: {
      table: 'group',
      column: 'id'
    }
  }, {
    name: 'when',
    type: 'timestamptz'
  }, {
    name: 'notes',
    type: 'text'
  }]
});

schema.addRelationship({
  name: 'groups',
  from: 'user',
  to: 'group',
  through: 'userToGroup'
});

schema.addRelationship({
  name: 'meetings',
  from: 'group',
  to: 'meeting'
});

describe('schema', function() {
  describe('simple', function() {
    it('works', function(done) {
      schema.db.verify(function(query, cb) {
        cb(null, [{id: 1, email: 'brian@test.com'}]);
      });
      var q = schema
        .find('user')
        .execute(ok(function(result) {
          assert(result, 'should return result');
          assert.equal(result.length, 1);
          var item = result.pop();
          assert.equal(item.id, 1);
          assert.equal(item.email, 'brian@test.com');
          done();
        }));
    });
  });
  describe('include relationship', function() {
    it('one-to-many works', function(done) {
      schema.db.verify(function(query, cb) {
        console.log('need to check query');
        console.log(query.toQuery());
        var row = {};
        row['group.id'] = 1;
        row['group.name'] = "cool group";
        row['meeting.id'] = 2;
        row['meeting.groupId'] = 1;
        row['meeting.notes'] = 'the meeting was cool';
        row['meeting.when'] = new Date();
        cb(null, [row]);
      });
      var q = schema
        .find('group')
        .include('meetings')
        .execute(ok(function(results) {
          assert(results);
          assert.equal(results.length, 1, "Should have 1 item in results");
          var row = results.pop();
          assert.equal(row.id, 1);
          assert.equal(row.name, 'cool group');
          assert(row.meetings, 'should have a meetings collection');
          assert.equal(row.meetings.length, 1, "should have 1 referenced meeting");
          var meeting = row.meetings.pop();
          assert.equal(meeting.id, 2);
          assert.equal(meeting.notes, 'the meeting was cool');
          assert.equal(meeting.when.getFullYear(), new Date().getFullYear());
          done();
        }));
    });

    it('many-to-many works', function(done) {
      schema.db.verify(function(query, cb) {
        console.log('need to check query');
        console.log(query.toQuery());
        var row = {};
        row['user.id'] = 1;
        row['user.email'] = 'test@test.com';
        row['userToGroup.id'] = 2;
        row['userToGroup.userId'] = 1;
        row['userToGroup.groupId'] = 3;
        row['group.id'] = 3;
        row['group.name'] = 'test group';
        cb(null, [row]);
      });
      var q = schema
      .find('user')
      .include('groups')
      .execute(function(err, items) {
        assert.ifError(err);
        assert(items);
        assert(items.length, 1);
        var user = items.pop();
        assert.equal(user.id, 1);
        assert.equal(user.email, 'test@test.com');
        assert(user.groups, 'should have groups collection');
        assert.equal(user.groups.length, 1, 'should have 1 associated group');
        var group = user.groups.pop();
        assert.equal(group.id, 3);
        assert.equal(group.name, 'test group');
        done();
      });
    });
  });
});
