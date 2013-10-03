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

module.exports.def =
  user:
    name: "user"
    columns:
      id: pk
      name:
        type: "TEXT"
  event:
    name: "event"
    columns:
      id: pk
      title:
        type: "TEXT"
  membership:
    columns:
      id: pk
      userId: uid
      eventId:
        references: "event"
  gift:
    columns:
      id: pk
      userId: uid
