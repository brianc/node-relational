process.env.PGDATABASE = process.env.PGDATABASE || "relational_test"
console.log('using postgres database', process.env.PGDATABASE)

pg = require "pg.js"

fs = require "fs"
coffee = require "coffee-script"

query = require "pg-query"

pg.defaults.poolSize = 1


module.exports.transaction = ->
  before (done) -> query "BEGIN", done
  after (done) -> query "ROLLBACK", done

pk =
  type: "SERIAL"
  primaryKey: true

uid =
  type: "INT"
  references: "user"

text =
  type: "TEXT"

module.exports.def =
  user:
    name: "user"
    columns:
      id: pk
      email: text
      password: text

  event:
    name: "event"
    columns:
      id: pk
      title: text

  membership:
    columns:
      id: pk
      eventId:
        type: "INT"
        references: "event"
      userId: uid

  gift:
    columns:
      id: pk
      userId: uid
      title: text
