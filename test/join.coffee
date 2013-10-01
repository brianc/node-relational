ok = require "okay"

assert = require "assert"
Schema = require "../src/schema"

{def} = require "./helper"

describe "Joiner", ->
  before ->
    @schema = new Schema def

  it "loads hasMany", (done) ->

    query = @schema.join
      from: "user"
      to: "gift"
      as: "gifts"

    query.order = "email"

    query.run ok (rows) ->
      assert.equal rows.length, 3

      first = rows[0]
      assert.equal first.email, '1@test.com'
      assert.equal first.gifts.length, 1
      assert.equal first.gifts[0].userId, first.id

      second = rows[1]
      assert.equal second.email, '2@test.com'
      assert.equal second.gifts.length, 2

      third = rows[2]
      assert.equal third.email, '3@test.com'
      assert.equal third.gifts.length, 0

      done()

  it "loads another hasMany", (done) ->
    query = @schema.join
      from: "event"
      to: "membership"
      as: "memberships"

    query.order = "title"

    query.run ok (rows) ->
      assert.equal rows.length, 2
      first = rows[0]
      assert.equal first.title, "event1"
      assert.equal first.memberships.length, 3
      done()


  it "loads belongsTo", (done) ->
    util = require "util"

    query = @schema.join
      from: "gift"
      to: "user"
      as: "owner"
      single: true

    query.where = {id: 1}

    query.run ok (rows) ->
      assert rows.length, 1
      gift = rows[0]
      assert gift.owner
      assert !util.isArray(gift.owner), "Owner should not be an array"
      assert.equal gift.owner.email, '1@test.com'
      done()

  it "loads two joins", (done) ->
    query = @schema.join
      from: "membership"
      to: "user"
      single: true


    @schema.join query,
      from: "membership"
      to: "event"
      single: true

    query.where = { "membership.eventId": 1 }

    query.run ok done, (rows) ->
      assert.equal rows.length, 3
      membership = rows[0]
      {user, event} = membership
      assert event
      assert.equal user.email, "1@test.com"
      assert.equal event.title, 'event1'
      done()

  it "loads nested", (done) ->
    inner = @schema.join
      from: "membership"
      to: "user"
      single: true

    query = @schema.join
      from: "event"
      to: inner
      as: "memberships"

    query.where = "event.id": 1

    query.run ok done, (rows) ->
      assert.equal rows.length, 1
      event = rows[0]
      assert.equal event.memberships.length, 3
      assert event.memberships[0].user
      assert.equal event.memberships[0].user.email, '1@test.com'
      done()

  it "loads double nested", (done) ->
    child = @schema.join
      from: "user"
      to: "gift"
      as: "gifts"

    middle = @schema.join
      from: "membership"
      to: child
      single: true
      as: 'member'

    query = @schema.join
      from: "event"
      to: middle
      as: 'memberships'

    query.where = { "event.id": 1 }

    query.run ok done, (rows) ->
      assert.equal rows.length, 1
      event = rows[0]
      assert.equal event.memberships.length, 3
      assert.equal event.memberships[0].member.gifts.length, 1
      assert.equal event.memberships[1].member.gifts.length, 2
      assert.equal event.memberships[2].member.gifts.length, 0
      done()

  it "loads has-many-through", (done) ->
    query = @schema.join
      from: "event"
      through: "membership"
      to: "user"
      as: "members"

    query.where = {"event.id": 1}

    query.run ok done, (rows) ->
      assert.equal rows.length, 1
      event = rows[0]
      assert event.members, "event missing members collection"
      done()

  it "loads has-one-through", (done) ->
    query = @schema.join
      from: "gift"
      to: "membership"
      through: "user"
      as: "membership"
      single: true

    query.where = {"gift.id": 1}

    query.run ok done, (rows) ->
      assert.equal rows.length, 1
      gift = rows[0]
      assert gift.membership
      assert !gift.membership.length, "membership should not have a length"
      assert.equal gift.membership.userId, 1
      done()
