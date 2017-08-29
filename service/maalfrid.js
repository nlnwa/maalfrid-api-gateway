const config = require('../config');
const grpc = require('grpc');
const api = grpc.load(config.sproett.proto_path).maalfrid;
const address = config.sproett.host + ':' + config.sproett.port;

const maalfrid = new api.Maalfrid(address, grpc.credentials.createInsecure());

exports.detectLanguage = (text) => {
    return new Promise((resolve, reject) => {
        maalfrid.detectLanguage({text: text}, (err, response) => {
            if (err) {
                return reject(err);
            }
            return resolve(response.language);
        });
    });
};
