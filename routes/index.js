var express = require('express');
var router = express.Router();

module.exports = router.get('/', (req, res) => res.status(200).send('/api/stats/:uri/:lix?/:wc?'));
