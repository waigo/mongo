/**
 * @fileOverview Check that mongoose db indexes got created ok.
 */
"use strict";

var _ = require('waigo')._,
  debug = require('debug')('waigo-mongo-indexes'),
  Q = require('bluebird');


module.exports = function*(app) {
  app.logger.debug('Checking Mongoose db indexes...');

  yield _.map(app.db.models, function(ModelClass, name) {
    return new Q(function(resolve, reject) {
      debug('Checking ' + name);

      ModelClass.ensureIndexes(function(err) {
        if (err) {
          reject(err) 
        } else {
          resolve();
        }
      });
    });
  });
};


