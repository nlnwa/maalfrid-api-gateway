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
  let keys = []

  /**
   * Get public signing key for signature verification
   *
   * @param issuer {string} issuer URL
   * @param kid {string} key id
   * @returns {Promise<string>} PEM formatted key string
   */
  async function getSigningKey (issuer, kid) {
    let key = findSigningKey(kid)
    if (key === undefined) {
      // key was not found, so load keys for the first time or reload keys in case of key rotation
      keys = await getJWKS(issuer)
      key = findSigningKey(kid)
    }
    if (key === undefined) {
      // no signing key with supplied kid found
      return ''
    }
    if (!key.pem) {
      // convert key to pem and store as property on key object
      try {
        key.pem = jwkToPem(key)
      } catch (err) {
        // jwk malformed or does not represent a valid key
        return ''
      }
    }
    return key.pem
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
   * @param issuer {string} issuer url
   * @returns {Promise<array>} promise of array of signing keys
   */
  async function getJWKS (issuer) {
    const config = JSON.parse(await request(issuer + WELL_KNOWN_PATH))
    const jwksUri = config[JWKS_URI]
    const jwks = JSON.parse(await request(jwksUri))
    // only signing keys
    return jwks.keys.filter(key => key.use === 'sig')
  }

  return Object.freeze({ getSigningKey })
}

module.exports = makeKeyStore()
