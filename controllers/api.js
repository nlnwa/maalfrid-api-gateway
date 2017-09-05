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

function qFilterCrawlLog(args) {
  const uri = args.url || '';
  const hostname = getHostName(uri);

  return r.table('crawl_log')
    .filter((crawl) =>
            crawl('requestedUri').match(`^${uri}`)
            .or(crawl('referrer').match(`^${hostname}`))
           );
}

function qFilterExtractedText(query, args) {
  const lix = parseInt(args.lix) || 0;
  const wc = parseInt(args.wc) || 0;
  const sc = parseInt(args.sc) || 0;
  const cc = parseInt(args.cc) || 0;
  const lwc = parseInt(args.lwc) || 0;

  return query.filter(
    r.row('wordCount').gt(wc)
      .and(r.row('lix').gt(lix))
      .and(r.row('characterCount').gt(cc))
      .and(r.row('longWordCount').gt(lwc))
      .and(r.row('sentenceCount').gt(sc)));
}

function qJoinExtractedText(query) {
  return query.eqJoin('warcId', r.table('extracted_text'));
}

function qFilteredExtractedTextWithUriOrReferrer(args) {
  return qFilterExtractedText(
    qJoinExtractedText(qFilterCrawlLog(args)).getField('right'),
    args
  );
}

function updateLanguageCodes(updates) {
  const rUpdates = r.expr(updates);
  return r.table('extracted_text')
    .getAll(r.args(Object.keys(updates)))
    .update((extractedText) => rUpdates(extractedText('warcId')))
    .run();
}

function getFilteredExtractedTextsWithUriOrReferrer(args) {
  return qFilteredExtractedTextWithUriOrReferrer(args)
    .run();
}

function getLanguageCodes(args) {
  return qFilterExtractedText(
    qJoinExtractedText(qFilterCrawlLog(args)).getField('right'), args)
    .getField('language')
    .coerceTo('array')
    .run();
}

function getReferrerOrUriWithLanguageCode(args) {
  let code = args.code || '';
  code = code.toUpperCase();

  return qJoinExtractedText(qFilterCrawlLog(args))
    .filter((m) => m('right')('language').match(code))
    .pluck({'left': ['referrer', 'requestedUri'], 'right': ['language']})
    .map((v) => v('left').merge(v('right')))
    .run();
}

// POST /api/detect
function detect(req, res) {
  let subjects;
  getFilteredExtractedTextsWithUriOrReferrer(req.body)
    .then((result) => {
      subjects = result;
      return Promise.all(
        result.map((data) => maalfrid.detectLanguage(data.text))
      );
    })
    .then((languageCodes) => {
      let updates = {};
      subjects.forEach((subject, index) => {
        updates[subject.warcId] = {language: languageCodes[index]};
      });
      return updates;
    })
    .then((updates) => updateLanguageCodes(updates))
    .then((u) => res.json(u));
}

function stats(req, res) {
  getLanguageCodes(req.query)
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
}

function language(req, res) {
  getReferrerOrUriWithLanguageCode(req.query)
    .then((result) => {
      const response = [];
      result.forEach((value) => {
           if (value.requestedUri) {
            response.push(value.requestedUri);
          } else {
            response.push(value.referrer);
          }
      });
      res.json(response);
    })
    .catch((err) => res.status(500).send(err.message));
}

module.exports = {
  stats,
  language,
  detect,
};
