toQuery = require "./to-query"

module.exports = class Joiner
  constructor: (@schema) ->

  join: (query, config) ->
    if query.through?
      return doThroughJoin @schema, query, config

    doJoin @schema, query, config


doThroughJoin = (schema, query, config) ->
  if typeof config is "undefined"
    config = query
    query = baseQuery config.from

  firstJoinPath = getJoinPath schema, config.from, config.through
  secondJoinPath = getJoinPath schema, config.through, config.to

  firstJoin = do ->
    to = firstJoinPath.to
    from = firstJoinPath.from
    firstJoin =
      type: "left"
      target: to.table.name
      on: {}

    firstJoin.on[to.column.ns(to.table.name)] =
      "$#{from.column.ns(from.table.name)}$"

    return firstJoin

  secondJoin = do ->
    to = secondJoinPath.to
    from = secondJoinPath.from
    secondJoin =
      type: "left"
      target: to.table.name
      on: {}

    secondJoin.on[to.column.ns(to.table.name)] =
      "$#{from.column.ns(from.table.name)}$"

    return secondJoin


  relation =
    type: "collection"
    table: secondJoin.target
    alias: config.as

  query.groupBy or= []

  if config.single
    relation.type = "foreign"
    query.groupBy.push "#{secondJoin.target}.id"


  query.columns.push relation
  query.joins = [firstJoin, secondJoin]
  query.groupBy.push "#{config.from}.id"

  return query


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

  joinPath = getJoinPath(schema, config.from, config.to)
  right = joinPath.to.table.name
  rightKey = joinPath.to.table.getPrimaryKey()

  agg =
    type: "array-agg"
    table: right
    alias: "items"

  ss_pkey = joinPath.to.column.ns(joinPath.to.table.name)
  subselect =
    type: "select"
    columns: [ss_pkey, agg]
    table: right
    groupBy: [ss_pkey]

  # make sure we group by the original table
  joinFrom = joinPath.from.column.ns(joinPath.from.table.name)
  join =
    type: "left"
    target: subselect
    alias: config.as or right
    on: {}
  join.on[joinFrom] = "$#{joinPath.to.column.ns(as)}$"


  query.columns.push
    type: "nice-array"
    columns: ["#{as}.items"]
    table: right
    alias: as

  query.joins.push join

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
  toQuery
    type: 'select'
    columns: ["#{from}.*"]
    table: [from]
    joins: []


getJoinPath= (schema, from, to) ->
  # expect from is always string name of table
  from = schema.getTable from
  to = schema.getTable to
  return from.findJoin to


handleNested= (schema, query, config) ->
  # config is already a query object

  joinPath = getJoinPath(schema, config.from, config.to.table[0])

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
