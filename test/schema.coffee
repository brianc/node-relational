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
