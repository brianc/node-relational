builder = require "mongo-sql"

builder.registerQueryType "collection", """
  array_to_json(
    COALESCE(
      NULLIF(
        array_agg( {table}.* ), ARRAY[NULL]::{table}[]),
      ARRAY[]::{table}[]))
"""

builder.registerQueryType "foreign", """
  row_to_json({table}.*)
"""


Table = require "./table"
Joiner = require "./joiner"

module.exports = class Schema
  constructor: (config) ->
    @tables = []
    @add config if config?

  addTable: (config) ->
    table = new Table this, config
    @tables.push table
    return table

  getTable: (name) ->
    for table in @tables
      return table if table.name is name
    throw new Error("Could not find table with name '#{name}'")

  add: (config) ->
    for key, val of config
      val.name or= key
      @addTable val
    return this

  join: (query, config) ->
    new Joiner(this).join query, config
