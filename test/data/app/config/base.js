var waigo = require('waigo');


module.exports = function(config) {
  waigo.load('waigo:config/base')(config);

  config.port = parseInt(Math.random() * 20000 + 10000);
  config.baseURL = 'http://localhost:' + config.port;

  var app = waigo.load('application').app;

  config.startupSteps = app.testConfig.startupSteps || [];

  config.db = app.testConfig.db || null;

  config.sessions = app.testConfig.sessions || null;

  config.middleware = app.testConfig.middleware || [];
};


