const express = require('express');
const router = new express.Router();
const api = require('../controllers/api');

router.get('/stats/', api.stats);
router.get('/language', api.language);

router.get('/',
           (req, res) => res.status(200)
           .send('/api/stats?url=&wc=&lix=&cc=&lwc=&sc'));

module.exports = router;
