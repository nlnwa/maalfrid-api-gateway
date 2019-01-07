let LOGGER
const THREAD = '[main]'

const LEVEL = {
  TRACE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 4,
  ERROR: 5
}

const configLevel = (process.env.LOG_LEVEL || '').toUpperCase()
const runLevel = LEVEL[configLevel] || LEVEL.INFO

/**
 * Log messages using level
 *
 * @param {number} level
 * @param {string} messages
 */
function log (level, ...messages) {
  if (runLevel > LEVEL[level]) return

  const args = [new Date().toISOString(), THREAD, level, LOGGER, '-', ...messages]

  switch (LEVEL[level]) {
    case LEVEL.TRACE:
    case LEVEL.DEBUG:
      console.log(...args)
      break
    case LEVEL.INFO:
      console.info(...args)
      break
    case LEVEL.WARN:
      console.warn(...args)
      break
    case LEVEL.ERROR:
      console.error(...args)
      break
    default:
      log(LEVEL.INFO, ...messages)
      break
  }
}

/**
 * Create logger method for a level
 *
 * @param {string} level
 * @return {function}
 */
const create = (level) => (...args) => log(level, ...args)

/**
 * @param {string} logger name
 * @return {Object} an object with one logger method per log level
 */
module.exports = (logger) => {
  LOGGER = logger

  return {
    trace: create('TRACE'),
    debug: create('DEBUG'),
    info: create('INFO'),
    warn: create('WARN'),
    error: create('ERROR')
  }
}
