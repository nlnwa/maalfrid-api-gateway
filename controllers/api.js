const maalfrid = require('../service/maalfrid');
const config = require('../config');
const r = require('rethinkdbdash')(config.rethinkdb);

function getHostName(url) {
  const parts = url.split('/');
  if (parts.length < 4) {
    return url;
  } else {
    return parts[0] + '/' + parts[1] + '/' + parts[2] + '/';
  }
}

function getFromDatabase(query) {
  const uri = query.url || '';
  const hostname = getHostName(query.url);
  const lix = parseInt(query.lix) || 0;
  const wc = parseInt(query.wc) || 0;
  const sc = parseInt(query.sc) || 0;
  const cc = parseInt(query.cc) || 0;
  const lwc = parseInt(query.lwc) || 0;

  return r.table('crawl_log')
    .filter((crawl) =>
            crawl('requestedUri').match(`^${uri}`)
            .or(crawl('referrer').match(`^${hostname}`))
           )
    .eqJoin('warcId', r.table('extracted_text'))
    .getField('right')
    .filter(
      r.row('wordCount').gt(wc)
        .and(r.row('lix').gt(lix))
        .and(r.row('characterCount').gt(cc))
        .and(r.row('longWordCount').gt(lwc))
        .and(r.row('sentenceCount').gt(sc)))
    .run();
}

exports.stats = (req, res) => {
  getFromDatabase(req.query)
    .then((extracts) => Promise.all(extracts.map((data) => maalfrid.detectLanguage(data.text))))
    .then((codes) => {
      const total = codes.length;
      let count = {};
      codes.map((value) => {
        if (!(value in count)) {
          count[value] = 1;
        } else {
          count[value] += 1;
        }
      });

      res.json({
        total,
        count,
      });
    }).catch((err) => console.error(err));
};
