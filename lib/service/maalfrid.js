const config = require('../config');
const grpc = require('grpc');

const protocol = grpc.load(config.maalfrid.protocol);
const address = config.maalfrid.host + ':' + config.maalfrid.port;
const maalfrid = new protocol.api.Maalfrid(address, grpc.credentials.createInsecure());

exports.detectLanguage = (text) => {
    return new Promise((resolve, reject) => {
        maalfrid.detectLanguage({text: text}, (err, response) => {
            if (err) {
                return reject(err);
            }
            return resolve(response.languages[0]);
        });
    });
};
