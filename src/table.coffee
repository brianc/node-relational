statement = require "./statement"
Column = require "./column"
toQuery = require "./to-query"

module.exports = class Table
  constructor: (@schema, config) ->
    @name = config.name
    @config = config
    @columns = {}
    @primaryKey = null
    for name, cfg of config.columns
      col = new Column @schema, this, name, cfg
      @columns[name] = col
      @primaryKey = col if col.primaryKey

  # get a column by name
  getColumn: (name) ->
    return @columns[name]

  # returns the primary key column
  getPrimaryKey: ->
    @primaryKey

  _pair: (fromCol, toCol) ->
    {from: fromCol.tuple(), to: toCol.tuple()}

  _findJoin: (table, other, reverse) ->
    for key, col of table.columns
      continue unless col.ref?
      {table, column} = col.ref
      if table.name is other.name
        if reverse
          return @_pair column, col
        return @_pair col, column

  findJoin: (other) ->
    # TODO this can be memoized
    return @_findJoin(this, other) or @_findJoin(other, this, true)

  create: (ifNotExists) ->
    toQuery
      type: "create-table"
      table: @name
      ifNotExists: ifNotExists
      definition: @config.columns

  drop: (ifExists) ->
    toQuery
      type: 'drop-table'
      table: @name
      ifExists: ifExists
