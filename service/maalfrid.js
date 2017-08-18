'use strict';

const grpc = require('grpc');
const PROTO_PATH = 'api/maalfrid.proto';
const api = grpc.load(PROTO_PATH).maalfrid;
const GRPC_MAALFRID = process.env.GRPC_MAALFRID || 'localhost:50051';

var maalfrid = new api.Maalfrid(GRPC_MAALFRID, grpc.credentials.createInsecure());

exports.detectLanguage = (text) => {
    return new Promise((resolve, reject) => {
        maalfrid.detectLanguage({text: text}, function (err, response) {
            if (err) {
                return reject(err);
            }
            return resolve(response.language);
        });
    });
};
