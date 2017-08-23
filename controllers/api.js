const maalfrid = require('../service/maalfrid');
const config = require('../config');
const r = require('rethinkdbdash')(config.rethinkdb);
const url = require('url');

function getFromDatabase(query) {
  const uri = query.url;
  const hostname = url.parse(uri).hostname; 
  const lix = parseInt(query.lix) || 0;
  const wc = parseInt(query.wc) || 0;

  console.log(`uri ${uri} :: lix ${lix} :: wc ${wc}`);

  return r.table('crawl_log')
    .filter((crawl) =>
            crawl('requestedUri').match(`^${uri}`)
            .or(crawl('referrer').match(`^${hostname}`))
           )
    .eqJoin('warcId', r.table('extracted_text'))
    .getField('right')
    .filter(r.row('wordCount').gt(wc).and(r.row('lix').gt(lix)))
    .getField('text')
    .run();
}

exports.stats = (req, res) => {
  getFromDatabase(req.query)
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
          }).catch((err) => console.error("ERROR" + err)));
};
