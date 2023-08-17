const express = require('express');
const router = express.Router();
const admin = require('../firebaseAdmin.js');

router.get('', (req, res) => {
  res.redirect('/');
});

router.post('', async (req, res) => {
  const idToken = req.body.idToken;

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Store user information in session
    req.session.user = { uid: decodedToken.uid, email: decodedToken.email };

    // Send success response
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});







//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;