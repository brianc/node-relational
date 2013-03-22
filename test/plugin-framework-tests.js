var assert = require('assert');
var relational = require(__dirname + '/../');

describe('plugins', function() {
  it('uses by name/action only once', function() {
    var name = 'test-test-test';
    relational.use(name, function(relational, Ctor) {
    });
    var len = relational.plugins.length;
    var p = relational.plugins.filter(function(plugin) {
      return plugin.name == name;
    });
    assert.equal(p.length, 1);
    relational.use(name, function(relational, Ctor) {
    });
    var p = relational.plugins.filter(function(plugin) {
      return plugin.name == name;
    });
    assert.equal(p.length, 1);
    assert.equal(relational.plugins.length, len);
    relational.plugins = relational.plugins.filter(function(plugin) {
      return plugin.name != name;
    })
  });

  it('uses plugin by name only', function() {
    var name = 'mock-database';
    relational.use('mock-database');
    var p = relational.plugins.filter(function(plugin) {
      return plugin.name == 'mock-database';
    });
    assert.equal(p.length, 1);
    var plugin = p.pop();
    assert.equal(typeof plugin.init, 'function');
  });
});
