builder = require "mongo-sql"
module.exports = (obj, values) ->
  if typeof obj is "string"
    obj =
      text: obj
      values: values or null
      toQuery: ->
        return this
  else
    obj.toQuery = ->
      builder.sql(this).toQuery()

  obj.run = (cb) ->
    require("pg-query") this, cb

  return obj
