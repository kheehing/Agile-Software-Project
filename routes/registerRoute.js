const express = require('express');
const router = express.Router();
const saltRounds = 12;
const admin = require('./../firebaseAdmin.js');

router.get('', (req, res) => {
  res.render('register');
});

router.post('/', (req, res) => {
  const { email, password } = req.body;
  
  console.log(email);
  console.log(password);

  if (!email || !password) {
    console.log('Email and password are required.');
    return res.status(400).send('Email and password are required');
  }

  admin.auth().createUser({ email, password })
    .then(userRecord => {
      res.status(201).send('User registered successfully');
    })
    .catch(error => {
      console.error("Firebase error:", error.message);
      res.status(400).send(error.message);
    });
});













//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;