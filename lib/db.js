const dbConfig = require('./config').rethinkdb
const r = require('rethinkdb-js')(dbConfig)

/**
 *
 * @param {string} warcId
 * @return {object} extracted_text
 */
async function getExtractedText (warcId) {
  const extractedText = await r.db('veidemann').table('extracted_text').get(warcId).run()
  return extractedText === null ? null : extractedText['text']
}

function getStats (executionId) {
  return r.db('maalfrid').table('stats').get(executionId)('stats').run()
}

function getEntities () {
  return r.db('maalfrid').table('entities').run()
}

/**
 * Get list of seeds related to entity
 *
 * @param entityId {string} entity id
 * @returns {*} list of seeds
 */
function getSeeds (entityId) {
  return r.db('maalfrid').table('seeds').filter({entityId}).run()
}

/**
 * Get list of executions of job and seed within time interval
 *
 * @param {string} jobId
 * @param {string} seedId
 * @param {Date} startTime
 * @param {Date} endTime
 * @return {*} list of executions
 */
function getExecutions (jobId, seedId, startTime, endTime) {
  return r.db('maalfrid').table('aggregate')
    .getAll(seedId, {index: 'seedId'})
    .filter({jobId})
    // inclusive startTime, exclusive endTime
    .filter(r.row('endTime').during(startTime, endTime))
    .run()
}

function getFilter (seedId) {
  return r.db('maalfrid').table('filter').get(seedId).run()
}

function saveFilter (seedId, filter) {
  return r.db('maalfrid').table('filter').insert({seedId, filter}, {conflict: 'replace'}).run()
}

function getRoleMapping () {
  return r.db('veidemann').table('config_role_mappings').run()
}

module.exports = {
  saveFilter,
  getFilter,
  getSeeds,
  getEntities,
  getExtractedText,
  getStats,
  getExecutions,
  getRoleMapping
}
