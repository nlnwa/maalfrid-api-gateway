const db = require('./db')
const {detectLanguage} = require('./service/maalfrid')

async function detectLanguageOfText (ctx) {
  const text = ctx.request.body.value || ''

  ctx.assert(text, 400, 'no text value')

  const value = await detectLanguage(text)
  ctx.body = {value}
}

async function detectLanguageOfTextsMissingCode (ctx) {
  ctx.body = await db.detectAndUpdateTextsMissingCode()
}

async function generateAggregate (ctx) {
  ctx.body = await db.generateAggregate()
}

async function updateEntitiesAndSeeds (ctx) {
  ctx.body = {
    entities: await db.updateEntities(),
    seeds: await db.updateSeeds()
  }
}

async function getEntities (ctx) {
  ctx.body = {value: await db.getEntities()}
}

async function getSeeds (ctx) {
  const entityId = ctx.query.entity_id

  ctx.assert(entityId, 400, 'missing parameter: entity_id')

  ctx.body = {value: await db.getSeeds(entityId)}
}

async function getExecutions (ctx) {
  const args = ctx.query
  const seedId = args.seed_id || undefined
  const jobId = args.job_id || undefined
  const startTime = new Date(args.start_time)
  const endTime = new Date(args.end_time)

  ctx.assert(!isNaN(startTime.valueOf()), 400, 'startTime: Invalid Date')
  ctx.assert(!isNaN(endTime.valueOf()), 400, 'endTime: Invalid Date')

  const value = await db.getExecutions(jobId, seedId, startTime, endTime)

  ctx.body = {value}
}

async function getText (ctx) {
  const warcId = ctx.query.warc_id

  ctx.assert(warcId, 400, 'missing query parameter: warc_id')

  const value = await db.getExtractedText(warcId)
  ctx.assert(value, 404)
  ctx.body = {value}
}

async function getLanguageStatistic (ctx) {
  const executionId = ctx.query.execution_id

  ctx.assert(executionId, 400, 'missing query parameter: execution_id')

  let value

  if (executionId instanceof Array) {
    value = await Promise.all(executionId.map((id) => db.getStats(id)))
  } else {
    value = [await db.getStats(executionId)]
  }

  ctx.body = {value}
}

async function saveFilter (ctx) {
  const body = ctx.request.body
  const seedId = body.seed_id
  const filter = body.filter

  ctx.assert(seedId, 400, 'missing parameter: seed_id')
  ctx.assert(filter, 400, 'missing parameter: filter')

  const value = await db.saveFilter(seedId, filter)

  ctx.body = {value}
}

async function getFilter (ctx) {
  const seedId = ctx.query.seed_id

  ctx.assert(seedId, 400, 'missing query parameter: seed_id')

  const value = await db.getFilter(seedId)
  ctx.body = {value}
}

module.exports = {
  detectLanguageOfText,
  detectLanguageOfTextsMissingCode,
  generateAggregate,
  updateEntitiesAndSeeds,
  getEntities,
  getSeeds,
  getExecutions,
  getText,
  getFilter,
  saveFilter,
  getLanguageStatistic
}
