const config = require('../config')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const packageDefinition = protoLoader.loadSync(config.maalfrid.protocol)
const protocol = grpc.loadPackageDefinition(packageDefinition)
const address = config.maalfrid.host + ':' + config.maalfrid.port
const maalfrid = new protocol.api.Maalfrid(address, grpc.credentials.createInsecure())

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
