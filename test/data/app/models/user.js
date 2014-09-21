"use strict";


var waigo = require('waigo'),
  schema = waigo.load('support/db/mongoose/schema');


var UserSchema = schema.create({
  name: { type: String, required: true, unique: true },
}, {
  addTimestampFields: true
});


module.exports = function(dbConn) {
  return dbConn.model('User', UserSchema);
};

