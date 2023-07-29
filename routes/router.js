const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('home');
});
















//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
    res.status(404).render("404");
  });

module.exports = router;