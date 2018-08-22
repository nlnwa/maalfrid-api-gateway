const https = require('https')
const {URL} = require('url')
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Fetch url via https
 *
 * If NODE_ENV environment variable is different from 'production' allow self-signed certificates
 *
 * @param url
 * @returns {Promise<any>}
 */
function request (url) {
  const myUrl = new URL(url)
  const options = {
    hostname: myUrl.hostname,
    path: myUrl.pathname,
    rejectUnauthorized: isProduction
  }
  return new Promise((resolve, reject) => {
    const req = https.get(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        req.end()
        resolve(data)
      })
    }).on('error', reject)
  })
}

module.exports = request
