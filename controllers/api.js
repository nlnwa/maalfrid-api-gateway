'use strict';

var maalfrid = require('../service/maalfrid');
var data = require('../data/data.json');
var config = require('../config');
var r = require('rethinkdbdash')(config.rethinkdb);

exports.stats = function (req, res) {
    var data = getFromDatabase(req.params);

    Promise.all(data.map((text) => maalfrid.detectLanguage(text)))
        .then((codes) => {
            codes[4] = "NNO";

            var total = codes.length;
            var unique = {};
            codes.map((value) => {
                if (!(value in unique)) {
                    unique[value] = 1;
                } else {
                    unique[value] += 1;
                }
            });
            var result = [];
            for (let key in unique) {
                var entry = {};
                entry[key] = unique[key] / total;
                result.push( entry );
            }

            res.json(result);
        }).catch((err) => console.error(err));
}

function getFromDatabase(params) {
    var uri = params.uri;
    var lix = params.lix;
    var wc = params.wc;

/*
    r.table('crawl_log')
        .filter(function(crawl) {
            return crawl("requestedUri").eq("https://www.vinmonopolet.no/")
                .or(crawl("referrer").match("^https://www.vinmonopolet.no/"));
        }).eqJoin("warcId", r.db('broprox').table('extracted_text'))
        .getField("right")
        .filter(r.row("characterCount").gt(100))
        .getField("text");
*/

    return data;
}
