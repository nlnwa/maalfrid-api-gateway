'use strict';

module.exports = function(req, res, next) {
    var err = new Error('Not found');
    err.status = 404;
    next(err);
};
