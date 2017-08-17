'use strict';

const express = require('express');
var config = require('./config');
var cors = require('cors');
var logger = require('morgan');
var api = require('./routes/api');
var index = require('./routes/index');
var fourofour = require('./lib/404');
var error = require('./lib/error');

const HOST = process.env.HOST || config.express.host;
const PORT = process.env.PORT || config.express.port;

var app = express();

// middleware chain
app.use(cors(config.corsOptions));
app.use(logger('dev'));
app.use('/', index);
app.use('/api', api);
app.use(fourofour);
app.use(error);

app.listen(PORT, HOST, () => console.log(`Statsbrain server started ${HOST}:${PORT}`));
