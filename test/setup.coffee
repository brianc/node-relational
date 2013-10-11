# this is meant to be run as a script
return if module.parent?

{def} = require "./helper"
async = require "async"
ok = require "okay"

Schema = require "../src/schema"
schema = new Schema def

queries = []
queries.push schema.query "BEGIN"
for name, table of schema.tables
  queries.unshift table.drop(true)
  queries.push table.create(true)

queries.push schema.query """
DELETE FROM "membership";
DELETE FROM "gift";
DELETE FROM "event";
DELETE FROM "user";

INSERT INTO "user" VALUES (1, '1@test.com', '1234');
INSERT INTO "user" VALUES (2, '2@test.com', '1234');
INSERT INTO "user" VALUES (3, '3@test.com', '1234');

INSERT INTO "gift" (id, "userId", "title") VALUES (1, 1, 'one');
INSERT INTO "gift" (id, "userId", "title") VALUES (2, 2, 'one');
INSERT INTO "gift" (id, "userId", "title") VALUES (3, 2, 'one');

INSERT INTO "event" (id, title) VALUES (1, 'event1');
INSERT INTO "event" (id, title) VALUES (2, 'event2');

INSERT INTO "membership" VALUES (1, 1, 1);
INSERT INTO "membership" VALUES (2, 1, 2);
INSERT INTO "membership" VALUES (3, 1, 3);
INSERT INTO "membership" VALUES (4, 2, 2);
"""

queries.push schema.query "COMMIT"

x = (query, cb) -> query.run(cb)

start = Date.now()
async.mapSeries queries, x, ok (res) ->
  console.log "done. ran #{queries.length} queries in #{Date.now() - start} ms"
  require("pg.js").end()
