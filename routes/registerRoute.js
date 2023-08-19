const express = require('express');
const router = express.Router();
const saltRounds = 12;
const admin = require('./../firebaseAdmin.js');

router.get('', (req, res) => {
  res.render('register');
});













//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;