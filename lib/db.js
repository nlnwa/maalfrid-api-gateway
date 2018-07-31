const dbConfig = require('./config').rethinkdb
const r = require('rethinkdbdash')(dbConfig)
const config = require('./config')
const log = require('./logger')(config.app.name)
const {detectLanguage} = require('./service/maalfrid')

/**
 * Takes a cursor to an object with a 'text' property, detects the language and writes
 * the resulting language code to the object's 'language' property
 *
 * @param cursor
 * @returns object
 */
function detectAndUpdate (cursor) {
  return cursor.eachAsync((row) => {
    return detectLanguage(row.text)
      .then((results) => results[0])
      .then((result) =>
        r.db('veidemann').table('extracted_text')
          .get(row.warcId).update({language: result.code}).run()
      ).catch((err) => log.error('language detection failed for warcId: ', row.warcId, err.message))
  })
}

async function detectAndUpdateTextsMissingCode () {
  const query = r.db('veidemann').table('extracted_text').filter(r.row.hasFields('language').not())
  const count = query.count().run()
  const result = r.db('maalfrid').table('system').insert({startTime: r.now(), type: 'languageDetection', count})
  const id = result['generated_keys'][0]
  const cursor = query.run({cursor: true})
  detectAndUpdate(cursor)
    .then((_) => r.db('maalfrid').table('system').update({id, endTime: r.now()}))

  return r.db('maalfrid').table('system').get(id).run()
}

/**
 *
 * @param {string} warcId
 * @return {*} extracted_text
 */
function getExtractedText (warcId) {
  return r.db('veidemann').table('extracted_text').get(warcId)('text')
}

function getStats (executionId) {
  return r.db('maalfrid').table('stats').get(executionId)('stats').run()
}

function updateEntities () {
  return r.db('veidemann').table('config_crawl_entities')
    .filter((doc) => doc('meta')('label').contains({key: 'Group', value: 'Språkrådet'}))
    .forEach((entity) => r.db('maalfrid').table('entities').insert(entity, {conflict: 'replace'}))
    .run()
}

function updateSeeds () {
  return r.db('maalfrid').table('seeds').insert(
    r.db('veidemann').table('config_seeds')
      .getAll(r.args(r.db('maalfrid').table('entities').getField('id').coerceTo('array')), {index: 'entityId'})
    , {conflict: 'replace'})
    .run()
}

function getEntities () {
  return r.db('maalfrid').table('entities').run()
}

function getSeeds (entityId) {
  return r.db('maalfrid').table('seeds').filter({entityId}).run()
}

/**
 * Take all executions having a seedId matching any revelant (public sector) seed,
 * join it with crawl_log and extracted_text data and
 * write it to an aggregation table grouped on executionId and jobExecutionId
 *
 * @returns {Promise}
 */
async function generateAggregate () {
  let lowerBound, upperBound

  const aggregations = await r.db('maalfrid').table('system').filter({type: 'aggregation'}).orderBy(r.desc('startTime')).run()
  if (aggregations.length === 0) {
    lowerBound = new Date(0)
  } else {
    const lastAggregation = aggregations[0]
    if (!lastAggregation.hasOwnProperty('endTime')) {
      throw new Error('Aggregation already in progress')
    } else {
      lowerBound = lastAggregation.upperBound
    }
  }

  // find the time of the earliest started jobExecution still running
  const jobExecutionStates = await r.db('veidemann').table('job_executions')
    .orderBy('startTime')
    .pluck('startTime', 'state').run()
  const found = jobExecutionStates.find((elem) => elem.state === 'RUNNING')
  upperBound = found !== undefined ? found.startTime : new Date()

  const result = await r.db('maalfrid').table('system').insert({startTime: r.now(), type: 'aggregation', lowerBound, upperBound})
  const id = result['generated_keys'][0]

  // deliberatly not await promise
  createAggregate(lowerBound.toISOString(), upperBound.toISOString())
    .then(result => {
      return r.db('maalfrid').table('system').update({id, result, endTime: r.now()}).run({noreply: true})
    })
    .catch((error) => {
      return r.db('maalfrid').table('system').update({id, error}).run({noreply: true})
    })

  return r.db('maalfrid').table('system').get(id).run()
}

async function createAggregate (lowerBound, upperBound) {
  return r.db('maalfrid').table('aggregate').insert(
    // seeds joined with executions
    r.db('maalfrid').table('seeds').pluck('id')
      .eqJoin('id', r.db('veidemann').table('executions'), {index: 'seedId'})
      // discard seeds
      .getField('right')
      .withFields('id', 'startTime', 'endTime', 'state', 'jobExecutionId', 'seedId')
      // only executions in state FINISHED/ABORTED_TIMEOUT/ABORTED_MANUAL
      .filter(r.row('state').eq('FINISHED').or(r.row('state').eq('ABORTED_TIMEOUT')).or(r.row('state').eq('ABORTED_MANUAL')))
      // only executions not already aggregated
      .filter(r.row('startTime').during(r.ISO8601(lowerBound), r.ISO8601(upperBound)))
      // join with job executions
      .eqJoin('jobExecutionId', r.db('veidemann').table('job_executions'))
      // only FINISHED job executions
      .filter(r.row('right')('state').eq('FINISHED'))
      // discard job executions
      .getField('left')
      // join with crawl log
      .eqJoin('id', r.db('veidemann').table('crawl_log'), {index: 'executionId'})
      .without({
        // discarded from set of execution fields
        left: ['id', 'state'],
        // discarded from set of crawl log fields
        right: [
          'fetchTimeMs',
          'fetchTimeStamp',
          'timeStamp',
          'ipAddress',
          'blockDigest',
          'payloadDigest',
          'statusCode',
          'storageRef',
          'surt'
        ]
      })
      .zip()
      // join with extracted texts
      .eqJoin('warcId', r.db('veidemann').table('extracted_text'))
      // discard the text
      .without({right: ['text']})
      .zip()
      // only with language field
      .filter(r.row.hasFields('language'))
  ).run()
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
    .filter({seedId})
    .filter({jobId})
    // inclusive startTime, exclusive endTime
    .filter(r.row('endTime').during(r.expr(startTime), r.expr(endTime)))
    .run()
}

module.exports = {
  getSeeds,
  getEntities,
  getExtractedText,
  detectAndUpdateTextsMissingCode,
  getStats,
  updateSeeds,
  updateEntities,
  generateAggregate,
  getExecutions
}
