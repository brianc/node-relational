assert = require "assert"
ok = require "okay"

Schema = require "../src/schema"

{def} = require "./helper"

describe "Schema", ->

  it "can add table", ->
    schema = new Schema
    schema.addTable def.user
    assert.equal schema.tables.length, 1
    assert schema.getTable "user"

  it "can add bulk", ->
    schema = new Schema def
    assert schema.getTable "user"
    assert schema.getTable "membership"
describe "simple construction", ->

  simple =
    user:
      id:
        type: "serial"
        primaryKey: true
      email:
        type: "text"
    photo:
      name:
        type: "text"
      id:
        type: "serial"
        primaryKey: true
    userPhoto:
      userId:
        type: "int"
        primaryKey: true
        references: "user"
      photoId:
        type: "int"
        primaryKey: true
        references: "photo"

  relational = require "../src"
  schema = relational simple

  it "has 3 tables", ->
    assert schema.getTable("user")
    assert schema.getTable("userPhoto")
    assert schema.getTable("photo")

  it "has correct user table", ->
    user = schema.getTable "user"
    assert user.getColumn "id"
    assert user.getColumn "email"

  it "has correct photo table", ->
    photo = schema.getTable "photo"
    assert photo.getColumn "id"
    assert photo.getColumn "name"
