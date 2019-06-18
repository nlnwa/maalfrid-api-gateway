const db = require('./db')
const { detectLanguage } = require('./language')
const { filterAggregate } = require('./aggregate')

async function detectLanguageOfText (ctx) {
  const text = ctx.request.body.text || ''

  ctx.assert(text, 400, 'no text value')

  const value = await detectLanguage(text)
  ctx.body = { value }
}

async function getEntities (ctx) {
  ctx.body = { value: await db.getEntities() }
}

async function getSeeds (ctx) {
  const entityId = ctx.query.entity_id
  if (entityId) {
    ctx.body = { value: await db.getSeedsOfEntity(entityId) }
  } else {
    ctx.body = { value: await db.getSeeds() }
  }
}

async function getExecutions (ctx) {
  const args = ctx.query
  const seedId = args.seed_id || undefined
  const jobId = args.job_id || undefined
  const startTime = args.start_time && new Date(args.start_time)
  const endTime = args.end_time && new Date(args.end_time)

  ctx.assert(!startTime || !isNaN(startTime.valueOf()), 400, 'startTime: Invalid date format')
  ctx.assert(!endTime || !isNaN(endTime.valueOf()), 400, 'endTime: Invalid date format')

  const value = await db.getExecutions(jobId, seedId, startTime, endTime)

  ctx.body = { value }
}

async function getText (ctx) {
  const warcId = ctx.query.warc_id

  ctx.assert(warcId, 400, 'missing query parameter: warc_id')

  const value = await db.getExtractedText(warcId)
  ctx.assert(value, 404)
  ctx.body = { value }
}

async function getStatistics (ctx) {
  const startTimeStr = ctx.query.start_time
  const endTimeStr = ctx.query.end_time
  const entityId = ctx.query.entity_id

  const startTime = startTimeStr ? new Date(startTimeStr) : undefined
  const endTime = endTimeStr ? new Date(endTimeStr) : undefined

  const value = await db.getStatistics(startTime, endTime, entityId)

  ctx.body = { value }
}

async function saveFilterSet (ctx) {
  const filterSet = ctx.request.body

  if (filterSet.hasOwnProperty('validFrom')) {
    filterSet.validFrom = new Date(filterSet.validFrom)
    ctx.assert(!isNaN(filterSet.validFrom), 400, 'invalid date format: validFrom')
  }
  if (filterSet.hasOwnProperty('validTo')) {
    filterSet.validTo = new Date(filterSet.validTo)
    ctx.assert(!isNaN(filterSet.validTo), 400, 'invalid date format: validTo')
  }

  const value = await db.saveFilterSet(filterSet)

  ctx.body = { value }
}

async function createFilterSet (ctx) {
  return saveFilterSet(ctx)
}

async function getFilterSet (ctx) {
  const seedId = ctx.query['seed_id']
  let value

  if (seedId) {
    value = await db.getFilterSetBySeedId(seedId)
  } else {
    value = await db.getFilterSet()
  }
  ctx.body = { value }
}

async function getFilterSetById (ctx, id) {
  const value = await db.getFilterSetById(id)

  ctx.assert(value, 404, 'no filter with id', id)
  ctx.body = { value }
}

async function deleteFilterSet (ctx, id) {
  const value = await db.deleteFilterSet(id)

  ctx.body = { value }
}

async function applyFilters (ctx) {
  const { seed_id: seedId, start_time: startTime, end_time: endTime } = ctx.request.body

  const value = await filterAggregate({ seedId, startTime, endTime })

  ctx.body = { value }
}

module.exports = {
  detectLanguageOfText,
  applyFilters,
  getEntities,
  getSeeds,
  getExecutions,
  getText,
  getFilterSet,
  getFilterSetById,
  saveFilterSet,
  createFilterSet,
  deleteFilterSet,
  getStatistics
}
