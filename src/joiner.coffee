builder = require "mongo-sql"

module.exports = class Joiner
  constructor: (@schema) ->

  join: (query, config) ->
    doJoin @schema, query, config


doJoin= (schema, query, config) ->
  if typeof config is "undefined"
    config = query
    query = baseQuery config.from

  # if the join is nested, to is a query object
  # with a 'table' of the "from" of the nested query
  # otherwise, expect it to be a string table name
  if config.to.table?
    return handleNested schema, query, config

  as = config.as or config.to

  joinPath = getJoinPath(schema, config)
  right = joinPath.to.table.name

  # make sure we group by the original table
  join = buildJoin joinPath, config.to, config.to
  query.joins.push join

  query.groupBy or= [joinPath.from.table.getPrimaryKey().ns(joinPath.from.table.name)]

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


buildJoin = (joinPath, to, alias) ->
  # config is already a query object
  join =
    type: 'left'
    target: to
    alias: alias
    on: { }

  fromCol = joinPath.from.column.ns(joinPath.from.table.name)
  toCol = "$#{joinPath.to.column.ns(alias)}$"

  join.on[fromCol] = toCol

  return join


baseQuery= (from) ->
  query =
    type: 'select'
    columns: ["#{from}.*"]
    table: [from]
    joins: []
    toQuery: ->
      builder.sql(query).toQuery()
    run: (cb) ->
      require("pg-query") this, cb


getJoinPath= (schema, config) ->
  # expect from is always string name of table
  from = schema.getTable config.from
  to = schema.getTable(config.to.table?[0] or config.to)
  return from.findJoin to


handleNested= (schema, query, config) ->
  # config is already a query object

  joinPath = getJoinPath(schema, config)

  join = buildJoin(joinPath, config.to, config.as)
  query.joins.push join

  query.groupBy or= [joinPath.from.table.getPrimaryKey().ns(joinPath.from.table.name)]


  right = config.as

  if config.single
    query.columns.push """
    row_to_json("#{right}".*) as "#{right}"
    """
    query.groupBy.push "#{right}.*"

  else
    query.columns.push """
    array_to_json(array_agg("#{right}".*)) as "#{right}"
    """


  return query
