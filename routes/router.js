const express = require('express');
const router = express.Router();




















//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

app.get("*", (req, res) => {
    res.status(404).render("404");
  });

module.exports = router;