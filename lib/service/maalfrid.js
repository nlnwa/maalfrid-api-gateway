const config = require('../config');
const grpc = require('grpc');
const protocol = grpc.load(__dirname + '/../proto/maalfrid/maalfrid.proto');

const address = config.maalfrid.host + ':' + config.maalfrid.port;
const poolSize = config.maalfrid.poolSize;
const pool = [];
let poolIndex = 0;

for (let i = 0; i < poolSize; i++) {
    pool.push(new protocol.maalfrid.Maalfrid(address, grpc.credentials.createInsecure()));
}

function getService() {
  poolIndex++;
  if (poolIndex >= poolSize) {
    poolIndex = 0;
  }
  return pool[poolIndex];
}

exports.detectLanguage = (text) => {
    return new Promise((resolve, reject) => {
        getService().detectLanguage({text: text}, (err, response) => {
            if (err) {
                return reject(err);
            }
            return resolve(response.language);
        });
    });
};
