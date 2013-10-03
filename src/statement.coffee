builder = require "mongo-sql"

module.exports = statement = (config) ->
  config.toQuery = ->
    builder.sql(config).toQuery()
  config.run = (cb) ->
    require("pg-query") this, cb

  return config
