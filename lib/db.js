const dbConfig = require('./config').rethinkdb

const { r } = require('rethinkdb-ts')

/** @type {MasterPool} */
let connectionPool

async function connect () {
  connectionPool = await r.connectPool(dbConfig)
}

function disconnect () {
  if (connectionPool) {
    connectionPool.drain({ noreplyWait: true }).catch(() => {})
  }
}

/**
 * Health check
 *
 * @returns {Promise<string[]>}
 */
async function healthCheck () {
  return r.db('maalfrid').tableList().run()
}

/**
 *
 * @param {string} warcId
 * @return {object} extracted_text
 */
async function getExtractedText (warcId) {
  const extractedText = await r.db('veidemann').table('extracted_text').get(warcId).run()
  return extractedText === null ? null : extractedText['text']
}

/**
 *
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {Promise<Statistic[]>}
 */
function getStatistics (startTime, endTime) {
  if (endTime && startTime) {
    return r.db('maalfrid').table('statistics').between(startTime, endTime, { index: 'endTime' }).run()
  } else {
    return r.db('maalfrid').table('statistics').run()
  }
}

/**
 *
 * @returns {Promise<Object[]>}
 */
function getEntities () {
  return r.db('maalfrid').table('entities').run()
}

/**
 * Get list of seeds related to entity
 *
 * @param entityId {string} entity id
 * @returns {Promise<*>} list of seeds
 */
function getSeedsOfEntity (entityId) {
  return r.db('maalfrid').table('seeds').getAll(['crawlEntity', entityId], { index: 'configRefs' }).run()
}

function getSeeds () {
  return r.db('maalfrid').table('seeds').run()
}

/**
 * Get list of executions of job and seed within time interval
 *
 * @param {string} jobId
 * @param {string} seedId
 * @param {Date} startTime
 * @param {Date} endTime
 * @return {Promise<Aggregate>} list of executions
 */
function getExecutions (jobId, seedId, startTime, endTime) {
  let query = r.db('maalfrid').table('aggregate').getAll(seedId, { index: 'seedId' })

  // inclusive startTime, exclusive endTime
  if (startTime && endTime) {
    query = query.filter(r.row('endTime').during(startTime, endTime))
  } else if (startTime) {
    query = query.filter(r.row('endTime').gt(startTime))
  } else if (endTime) {
    query = query.filter(r.row('endTime').lt(endTime))
  }
  if (jobId) {
    query = query.filter({ jobId })
  }

  return query.run()
}

/**
 * @returns {Promise<FilterSet[]>}
 */
function getFilterSet () {
  return r.db('maalfrid').table('filter').run()
}

/**
 *
 * @param {string} id
 * @returns {Promise<FilterSet>}
 */
function getFilterSetById (id) {
  return r.db('maalfrid').table('filter').get(id).run()
}

/**
 *
 * @param {string} seedId
 * @returns {Promise<FilterSet[]>}
 */
function getFilterSetBySeedId (seedId) {
  return r.db('maalfrid').table('filter').getAll(seedId, { index: 'seedId' }).run()
}

/**
 *
 * @param {FilterSet} filterSet
 * @returns {Promise<WriteResult<any>>}
 */
function saveFilterSet (filterSet) {
  return r.db('maalfrid').table('filter').insert(filterSet, { conflict: 'replace' }).run()
}

/**
 *
 * @param id
 * @returns {Promise<WriteResult<any>>}
 */
function deleteFilterSet (id) {
  return r.db('maalfrid').table('filter').get(id).delete().run()
}

/**
 *
 * @returns {Promise<Array<{role: Array<string>, email: string, group: string}>>}
 */
function getRoleMapping () {
  return r.db('veidemann').table('config').filter({ kind: 'roleMapping' })('roleMapping').run()
}

module.exports = {
  connect,
  disconnect,
  healthCheck,
  saveFilterSet,
  deleteFilterSet,
  getFilterSetBySeedId,
  getFilterSetById,
  getFilterSet,
  getSeeds,
  getSeedsOfEntity,
  getEntities,
  getExtractedText,
  getStatistics,
  getExecutions,
  getRoleMapping
}
