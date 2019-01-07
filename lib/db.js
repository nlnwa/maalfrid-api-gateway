const dbConfig = require('./config').rethinkdb
const r = require('rethinkdb-js')(dbConfig)

async function healthz () {
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

function getStatistics (startTime, endTime) {
  if (endTime && startTime) {
    return r.db('maalfrid').table('statistics').between(startTime, endTime, { index: 'endTime' }).run()
  } else {
    return r.db('maalfrid').table('statistics').run()
  }
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
function getSeedsOfEntity (entityId) {
  return r.db('maalfrid').table('seeds').filter({ seed: { entityId } }).run()
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
 * @return {*} list of executions
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

function getFilterById (id) {
  return r.db('maalfrid').table('filter').get(id).run()
}

function getFilterBySeedId (seedId) {
  return r.db('maalfrid').table('filter').getAll(seedId, { index: 'seedId' }).run()
}

function saveFilter (filter) {
  return r.db('maalfrid').table('filter').insert(filter, { conflict: 'replace' }).run()
}

function deleteFilter (id) {
  return r.db('maalfrid').table('filter').get(id).delete().run()
}

function getRoleMapping () {
  return r.db('veidemann').table('config_role_mappings').run()
}

module.exports = {
  healthz,
  saveFilter,
  deleteFilter,
  getFilterBySeedId,
  getFilterById,
  getSeeds,
  getSeedsOfEntity,
  getEntities,
  getExtractedText,
  getStatistics,
  getExecutions,
  getRoleMapping
}
