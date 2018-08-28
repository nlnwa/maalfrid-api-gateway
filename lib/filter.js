let r // reQL namespace
let log

const prefixRegexp = (str) => r.add('^', str)
const prefixOf = (field) => (str) => field.match(prefixRegexp(str))
const equal = (field) => (str) => field.eq(str)
const someArrayElementIsPrefixOf = (field) => (array) => r.expr(array).contains(prefixOf(field))
const someArrayElementEquals = (field) => (array) => r.expr(array).contains(equal(field))

const undefinedFn = (name) => (field) => {
  log.warn('filter named \'' + name + '\' is not implemented')
  return true
}

const filterFnMap = Object.freeze({
  language: someArrayElementEquals,
  contentType: someArrayElementIsPrefixOf,
  discoveryPath: someArrayElementEquals,
  requestedUri: someArrayElementIsPrefixOf,
  lix: undefined,
  characterCount: undefined,
  longWordCount: undefined,
  sentenceCount: undefined,
  wordCount: undefined
})

const filterFn = (name) => filterFnMap[name] || undefinedFn(name)

const fieldFilter = (filterName, filterValue) => (doc) => filterFn(filterName)(doc.getField(filterName))(filterValue)

/*
function (doc) {
  return r.expr(['https://dfo.no']).contains(function (val) {
    return doc.getField('requestedUri').match(r.add('^', val))
  })
}
*/

/**
 * Transform stored filter values to a reQL object
 *
 * @param selection {selection|stream|array} reQL query object e.g. r.db('dbName').table('tableName')
 * @param filters {object} filters to apply to given reQL selection
 * @returns {selection|stream|array} reQL query object
 */
function filterToReql (selection, filters) {
  return Object.keys(filters).reduce((selection, name) => selection.filter(fieldFilter(name, filters[name])), selection)
}

/**
 * @param reql {object} reQL namespace (instance of rethinkdb driver)
 */
module.exports = (reql, logger) => {
  r = reql
  log = logger || {warn: () => {}}

  return {
    filterToReql,
    fieldFilter,
    filterFn,
    prefixOf,
    someArrayElementEquals,
    someArrayElementIsPrefixOf
  }
}
