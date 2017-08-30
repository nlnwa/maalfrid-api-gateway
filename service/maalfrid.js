const config = require('../config');
const grpc = require('grpc');
const api = grpc.load(config.sproett.proto_path).maalfrid;
const address = config.sproett.host + ':' + config.sproett.port;

const poolSize = config.sproett.poolSize;
const pool = [];
let poolIndex = 0;

for (let i = 0; i < poolSize; i++) {
    pool.push(new api.Maalfrid(address, grpc.credentials.createInsecure()));
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
