'use strict';

var express = require('express');
var router = express.Router();
var api = require('../controllers/api');

router.get('/stats/:uri/:lix?/:wc?', api.stats);

router.get('/', (req, res) => res.status(200).send('/api/stats/:uri/:lix?/:wc?'));

module.exports = router;
