module.exports = class Column

  constructor: (@schema, @table, @name, config) ->
    @_normalizeReference(@schema, config)
    for key, val of config
      this[key] = val


  # takes a reference in the style of
  # references: "table"
  # and converts to
  # references: { table: "table", column: "id" }
  _normalizeReference: (@schema, config) ->
    return unless typeof config.references is "string"
    ref = @schema.getTable config.references
    pkey = ref.getPrimaryKey()
    config.references =
      table: ref.name
      column: pkey.name
    config.ref =
      table: ref
      column: ref.getPrimaryKey()

  # give a namspace such as a table name to the column
  ns: (namespace) ->
    "#{namespace}.#{@name}"

  # returns a tuple of
  # {table: parentTable, column: this }
  tuple: ->
    {table: @table, column: this}

  # test method, do not use
  getFullName: ->
    "#{@table.name}.#{@name}"
