# relational

The idea I'm kicking around is this...

Start by defining your schema with JSON structures:

Please note this is a MAJOR not finished not even released project.

```js
var Relational = require('relational');
var schema = new Relational().schema;

schema.addTable({
  name: 'user',
  columns: [{
    name: 'id',
    type: 'serial',
    primaryKey: true
  }, {
    name: 'email',
    type: 'text',
    allowNull: false
  }]
});

schema.addTable({
  name: 'photo',
  columns: [{
    name: 'id',
    type: 'serial',
    primaryKey: true
  }, {
    name: 'description',
    type: 'text'
  }, {
    name: 'userId',
    type: 'int',
    foreignKey: {
      table: 'user',
      column: 'id'
    }
  }]
});
```
The schema contains information about the _relationships_ between the tables as well as the individual tables via the foreign key property on a column.  What this will allow is something like this:

```js
//continuing the last example...

// Find me users
schema.find('user'); 
//SELECT * FROM "user"

// Find me users, include photos, let relational figure out how to join
schema.find('user').join('photo'); 
//SELECT "user"."id", "user.email", "photo.id", "photo.userId",
//"photo.description" FROM "user" INNER JOIN "photo" ON "user.id" EQUALS "photo.userId"

```

Basically...I really fancy query builder.  Something kinda like AREL maybe for ruby.  

I'm not sure where I will go after that, but this at least will be really for me.  This uses [node-sql] internally so it should be portable between databases with little work.

Other ideas:

1. migrations based on reflecting on the schema definition and comparing it to the current database schema
2. ORM functionality like CREATE, UPDATE, DELETE on rows
3. Lazy loading collections, bla bla
