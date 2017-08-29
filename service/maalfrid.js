const config = require('../config');
const grpc = require('grpc');
const api = grpc.load(config.sproett.proto_path).maalfrid;

const poolSize = require('os').cpus().length;
const pool = [];
for (let i = 0; i < poolSize; i++) {
  const address = config.sproett.host + ':' + (config.sproett.port + i);
  pool.push(new api.Maalfrid(address, grpc.credentials.createInsecure()));
}
let current = 0;
function getService() {
  const service = pool[current];
  current += 1;
  if (current == poolSize) {
    current = 0;
  }
  return service;
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
