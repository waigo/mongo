var waigo = require('waigo');

var app = waigo.load('app');

module.exports = function(config) {
  waigo.load('waigo:config/base')(config);

  config.port = parseInt(Math.random() * 20000 + 10000);
  config.baseURL = 'http://localhost:' + config.port;

  config.startupSteps = ['logging', 'middleware', 'routes', 'listener', 'database'];

  config.db = app.testConfig.db;

  config.sessions = app.testConfig.sessions;

  config.middleware = app.testConfig.middleware;
};


