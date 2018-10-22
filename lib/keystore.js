const request = require('./request')
const jwkToPem = require('jwk-to-pem')

/**
 * Make a keystore to cache publicKeys from OpenIdConnect issuer
 *
 * @returns {Readonly<{getSigningKey: (function(*=, *=): *)}>}
 */
function makeKeyStore () {
  const WELL_KNOWN_PATH = '/.well-known/openid-configuration'
  const JWKS_URI = 'jwks_uri'
  const MAX_RETRIES = 1 // retry once in case of key rotation
  let keys = []

  /**
   * Get public signing key for signature verification
   *
   * @param issuer {string} issuer URL
   * @param kid {string} key id
   * @returns {Promise<string>} PEM formatted key string
   */
  async function getSigningKey (issuer, kid) {
    let retries = 0
    let key = findSigningKey(kid)
    while (!key && retries <= MAX_RETRIES) {
      keys = await getJWKS(issuer)
      key = findSigningKey(kid)
      retries++
    }
    return key ? jwkToPem(key) : ''
  }

  /**
   * Find index of key in the store
   *
   * @param kid {string} key id
   * @returns {Object} key or undefined if not found
   */
  function findSigningKey (kid) {
    return keys.find(key => key.kid === kid)
  }

  /**
   * Get JSON Web Key Set
   *
   * @param issuer
   * @returns {Promise<any>}
   */
  async function getJWKS (issuer) {
    const config = JSON.parse(await request(issuer + WELL_KNOWN_PATH))
    const jwksUri = config[JWKS_URI]
    const jwks = JSON.parse(await request(jwksUri))
    // only signing keys
    return jwks.keys.filter(key => key.use === 'sig')
  }

  return Object.freeze({getSigningKey})
}

module.exports = makeKeyStore()
