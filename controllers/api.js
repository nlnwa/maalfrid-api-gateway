const maalfrid = require('../service/maalfrid');
const config = require('../config');
const r = require('rethinkdbdash')(config.rethinkdb);

function getFromDatabase(params) {
  const uri = params.uri;
  //  const lix = params.lix;
  //  const wc = params.wc;

  return r.table('crawl_log')
    .filter((crawl) =>
            crawl('requestedUri').eq(uri)
            .or(crawl('referrer').match(`^${uri}`))
           )
    .eqJoin('warcId', r.table('extracted_text'))
    .getField('right')
    .filter(r.row('characterCount').gt(100))
    .getField('text')
    .run();
}

exports.stats = (req, res) =>
  getFromDatabase(req.params)
  .then((data) =>
        Promise.all(data.map((text) => maalfrid.detectLanguage(text)))
        .then((codes) => {
          let total = codes.length;
          let unique = {};

          codes.map((value) => {
            if (!(value in unique)) {
              unique[value] = 1;
            } else {
              unique[value] += 1;
            }
          });
          let result = [];
          for (const key of Object.keys(unique)) {
            let entry = {};
            entry[key] = unique[key] / total;
            result.push( entry );
          }
          res.json(result);
        }).catch((err) => console.error(err)));
