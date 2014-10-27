"use strict";



var debug = require('debug')('waigo-mongo'),
  mongoose = require('mongoose-q')(require('mongoose')),
  Promise = require('bluebird');

/**
 * # Mongo database connection.
 *
 * This uses mongoose to create the connection.
 */



/**
 * Create a database connection.
 *
 * @param {Object} dbConfig configuration
 * @param {String} dbConfig.host server host
 * @param {Integer} dbConfig.port server port
 * @param {String} dbConfig.db database name
 * @param {String} [dbConfig.user] auth username
 * @param {String} [dbConfig.pass] auth password
 *
 * @return {Object} db connection.
 */
exports.create = function*(dbConfig) {
  var auth = '';
  if (dbConfig.user) {
    auth = dbConfig.user + ':' + dbConfig.pass + '@';
  }

  var url = 'mongodb://' + auth + dbConfig.host + ':' + dbConfig.port + '/' + dbConfig.db;
  debug(url);

  var db = mongoose.createConnection(url);
  
  return yield new Promise(function(resolve, reject) {
    db.on('error', function(err) {
      debug('Connection failed');
      reject(err);
    });
    db.once('open', function() {
      debug('Connection succeeded');
      db.removeListener('error', reject);
      resolve(db);
    });
  });
};



/**
 * Shutdown all database connections.
 */
exports.shutdown = function*() {
  return new Promise(function(resolve, reject) {
    mongoose.disconnect(function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
};


