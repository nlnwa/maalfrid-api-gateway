const config = require('./config')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const packageDefinition = protoLoader.loadSync(config.aggregatorService.protocol, {
  enums: String,
  defaults: true
})
const protocol = grpc.loadPackageDefinition(packageDefinition)
const address = config.aggregatorService.host + ':' + config.aggregatorService.port
const credentials = grpc.credentials.createInsecure()
const aggregator = new protocol.maalfrid.service.aggregator.Aggregator(address, credentials)

function filterAggregate (options) {
  return new Promise((resolve, reject) => {
    aggregator.filterAggregate(options, (err, response) => err ? reject(err) : resolve(response))
  })
}

module.exports = {
  filterAggregate
}
