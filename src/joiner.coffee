builder = require "mongo-sql"
module.exports = class Joiner
  constructor: (@schema) ->

  join: (query, config) ->
    @_doJoin @schema, query, config

  # build the base query if
  # none was passed to the join method
  _baseQuery: (from) ->
    query =
      type: 'select'
      columns: ["#{from}.*"]
      table: [from]
      joins: []
      toQuery: ->
        builder.sql(query).toQuery()
      run: (cb) ->
        require("pg-query") this, cb

  _handleNested: (schema, query, config) ->
    # config is already a query object
    join =
      type: 'left'
      target: config.to
      alias: config.as
      on: { }

    joinPath = @_getJoinPath(schema, config)

    join.on[joinPath.from.column.ns(joinPath.from.table.name)] = "$#{joinPath.to.column.ns(config.as)}$"

    query.groupBy = ["#{config.from}.id"]

    if config.single
      query.columns.push """
      row_to_json("#{config.as}".*) as "#{config.as}"
      """
      query.groupBy.push "#{config.as}.*"

    else
      query.columns.push """
      array_to_json(array_agg("#{config.as}".*)) as "#{config.as}"
      """

    query.joins.push join

    return query

  _getJoinPath: (schema, config) ->
    # expect from is always string name of table
    from = schema.getTable config.from
    # if the join is nested, to is a query object
    # with a 'table' of the "from" of the nested query
    # otherwise, expect it to be a string table name

    to = schema.getTable(config.to.table?[0] or config.to)

    return from.findJoin to

  _doJoin: (schema, query, config) ->
    if typeof config is "undefined"
      config = query
      query = @_baseQuery config.from


    from = schema.getTable config.from
    if config.to.table?
      return @_handleNested schema, query, config
    else
      to = schema.getTable config.to

    as = config.as or config.to

    # check for nesting
    joinPath = @_getJoinPath schema, config
    leftCol = joinPath.from.column.ns(joinPath.from.table.name)
    right = joinPath.to.table.name
    rightCol = joinPath.to.column.ns(joinPath.to.table.name)
    #console.log left, leftCol, right, rightCol

    # make sure we group by the original table
    query.groupBy or= [joinPath.from.table.getPrimaryKey().getFullName()]

    # add the join
    join = {
      type: "left"
      target: right
      on: {}
    }

    join.on[leftCol] = "$#{rightCol}$"
    query.joins.push join

    # add the aggregate column to the select columns list
    relation =
      type: 'collection'
      table: right
      alias: as

    if config.single
      relation.type = "foreign"
      query.groupBy.push "#{right}.*"

    query.columns.push relation

    return query
