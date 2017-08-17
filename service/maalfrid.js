'use strict';

const grpc = require('grpc');
const PROTO_PATH = process.env.PROTO_PATH || __dirname + '/../../api/maalfrid.proto';
const api = grpc.load(PROTO_PATH).maalfrid;

var maalfrid = new api.Maalfrid('localhost:50051', grpc.credentials.createInsecure());

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
