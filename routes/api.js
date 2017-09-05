const express = require('express');
const router = new express.Router();
const api = require('../controllers/api');
const bodyParser = require('body-parser');

router.get('/stats/', api.stats);
router.get('/language', api.language);
router.post('/detect', bodyParser.json(), api.detect);

router.get('/',
           (req, res) => res.status(200)
           .send('/api/stats?url=&wc=&lix=&cc=&lwc=&sc'));

module.exports = router;
