module.exports = function scope(relational, Ctor) {
  Ctor.createScope = function(builder) {
    var scope = function(cb) {
      return Ctor.find(builder.where, cb);
    }
    if(typeof builder == 'function') {
      var scope = function() {
        var lastArg = arguments[arguments.length-1];
        var queryPart = builder.apply(Ctor, arguments);
        if(typeof lastArg == 'function') {
          return Ctor.find.call(Ctor, queryPart.where, lastArg);
        }
        return Ctor.find.call(Ctor, queryPart.where);
      }
    }
    return scope;
  }
};
