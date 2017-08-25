require('dotenv').config();
const express = require('express');
const config = require('./config');
const cors = require('cors');
const logger = require('morgan');
const api = require('./routes/api');
const index = require('./routes/index');
const fourofour = require('./lib/404');
const error = require('./lib/error');

const HOST = process.env.HOST || config.express.host;
const PORT = process.env.PORT || config.express.port;

const app = express();

// middleware chain
app.use(cors(config.corsOptions));
app.use(logger('dev'));
app.use('/', index);
app.use('/api', api);
app.use(fourofour);
app.use(error);

app.listen(PORT, HOST, () => console.log(`Sprett running on ${HOST}:${PORT}`));
