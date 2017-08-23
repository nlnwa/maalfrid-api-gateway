const express = require('express');
const router = new express.Router();
const api = require('../controllers/api');

router.get('/stats', api.stats);

router.get('/',
           (req, res) => res.status(200).send('/api/stats/:uri/:lix?/:wc?'));

module.exports = router;
