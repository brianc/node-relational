var helper = require(__dirname);
var schema = helper.createSchema();
schema.use('has-many');
schema.use('belongs-to');
schema.use('has-many-through');
schema.use('scope');
