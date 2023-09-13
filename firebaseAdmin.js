const admin = require('firebase-admin');
if (process.env.HEROKU){
  const credential = process.env['CREDS'];

  admin.initializeApp({
    credential: admin.credential.cert(credential),
  });
  module.exports = admin;
} else {
  const credentials = require('./ServiceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
  
  module.exports = admin;
}
