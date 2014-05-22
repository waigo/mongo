var waigo = require('waigo');


module.exports = function(config) {
  waigo.load('waigo:config/base')(config);

  config.port = parseInt(Math.random() * 20000 + 10000);
  config.baseURL = 'http://localhost:' + config.port;
};


