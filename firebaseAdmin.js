const admin = require('firebase-admin');
const credentials = require('./ServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

module.exports = admin;