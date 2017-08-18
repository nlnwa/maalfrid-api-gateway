'use strict';

var maalfrid = require('../service/maalfrid');
var config = require('../config');
var r = require('rethinkdbdash')(config.rethinkdb);

exports.stats = (req, res) =>
    getFromDatabase(req.params)
    .then((data) =>
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
          }).catch((err) => console.error(err)));

function getFromDatabase(params) {
    var uri = params.uri;
    var lix = params.lix;
    var wc = params.wc;

    return r.table('crawl_log')
        .filter(function (crawl) {
            return crawl("requestedUri").eq(uri)
                .or(crawl("referrer").match("^" + uri));
        }).eqJoin("warcId", r.table('extracted_text'))
        .getField("right")
        .filter(r.row("characterCount").gt(100))
        .getField("text")
        .run();
}
