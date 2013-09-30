assert = require "assert"
Schema = require "../src/schema"

{def} = require "./helper"

describe "Table", ->
  before ->
    @schema = new Schema def
    @user = @schema.getTable "user"
    @gift = @schema.getTable "gift"

  it "has columns", ->
    assert.equal @user.name, "user"
    id = @user.columns.id
    assert.equal @user.columns.id, @user.getColumn "id"
    assert.equal @user.getPrimaryKey(), @user.getColumn "id"

  it "calculates join", ->
    join = @gift.findJoin @user
    assert join
    assert.equal join.from.table.name, "gift"
    assert.equal join.from.column.getFullName(), "gift.userId"
    assert.equal join.to.table.name, "user"
    assert.equal join.to.column.getFullName(), "user.id"

  it "calculates reverse join", ->
    join = @user.findJoin @gift
    assert join
    assert.equal join.from.table.name, "user"
    assert join.from.column, "missing join.from.column"
    assert.equal join.from.column.getFullName(), "user.id"
    assert.equal join.from.table.name, "user"
    assert.equal join.to.column.name, "userId"
    assert.equal join.to.column.table.name, "gift"
    assert.equal join.from.column.table.name, "user"
