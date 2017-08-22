const express = require('express');
const router = new express.Router();

module.exports =
  router.get('/',
             (req, res) => res.status(200).send('/api/stats/:uri/:lix?/:wc?'));

