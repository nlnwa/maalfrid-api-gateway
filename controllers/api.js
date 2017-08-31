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

function getQExtractedText(params) {
  const uri = params.url || '';
  const hostname = getHostName(uri);

  return r.table('crawl_log')
    .filter((crawl) =>
            crawl('requestedUri').match(`^${uri}`)
            .or(crawl('referrer').match(`^${hostname}`))
           )
    .eqJoin('warcId', r.table('extracted_text'));
}


function getQStats(params) {
  const lix = parseInt(params.lix) || 0;
  const wc = parseInt(params.wc) || 0;
  const sc = parseInt(params.sc) || 0;
  const cc = parseInt(params.cc) || 0;
  const lwc = parseInt(params.lwc) || 0;

  return getQExtractedText(params)
    .getField('right')
    .filter(
      r.row('wordCount').gt(wc)
        .and(r.row('lix').gt(lix))
        .and(r.row('characterCount').gt(cc))
        .and(r.row('longWordCount').gt(lwc))
        .and(r.row('sentenceCount').gt(sc)));
}

exports.stats = (req, res) => {
  getQStats(req.query).run()
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
    }).catch((err) => res.status(500).send(err.message));
};

exports.language = (req, res) => {
  let tmp; 
  const code = req.query.code || '';
  getQExtractedText(req.query).run()
    .then((extracts) => {
      tmp = extracts;
      return Promise.all(extracts.map((data) => maalfrid.detectLanguage(data.right.text)));
    }).then((codes) => {
      const result = [];
      codes.forEach((value, index) => {
        if (value == code.toUpperCase()) {
          if (tmp[index].left.requestedUri) {
            result.push(tmp[index].left.requestedUri);
          } else {
            result.push(tmp[index].left.referrer);
          }
        }
      });
      res.json(result);
    })
    .catch((err) => res.status(500).send(err.message));
};
