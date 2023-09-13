const admin = require('firebase-admin');
const credential = process.env.CREDS || require('./ServiceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(credential),
});
module.exports = admin;
