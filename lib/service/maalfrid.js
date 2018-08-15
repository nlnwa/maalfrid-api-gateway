const config = require('../config')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const packageDefinition = protoLoader.loadSync(config.maalfrid.protocol, {
  enums: String,
  defaults: true
})
const protocol = grpc.loadPackageDefinition(packageDefinition)
const address = config.maalfrid.host + ':' + config.maalfrid.port
const credentials = grpc.credentials.createInsecure()
const maalfrid = new protocol.maalfrid.api.Maalfrid(address, credentials)

exports.detectLanguage = (text) => {
  return new Promise((resolve, reject) => {
    maalfrid.detectLanguage({text: text}, (err, response) => {
      if (err) {
        return reject(err)
      }
      return resolve(response.languages)
    })
  })
}
