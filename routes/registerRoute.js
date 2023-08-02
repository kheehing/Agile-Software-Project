const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 12;
const admin = require('./../firebaseAdmin.js');

router.get('', (req, res) => {
  res.render('register');
});

router.post('/', (req, res) => {
  const { email, password } = req.body;

  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      return res.status(500).send('Error hashing password');
    }

    admin.auth().createUser({ email: email, password: password }).then(userRecord => {
      res.status(201).send('User registered successfully');
    }).catch(error => {
      res.status(400).send('Registration failed');
    });
  });
});












//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;