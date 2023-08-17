const express = require('express');
const router = express.Router();

router.get('', (req, res) => {
  res.render('login');
});

router.get('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'An error occurred during logout' });
    }

    // Clear the session cookie
    res.clearCookie('connect.sid');

    // Redirect to the home page or login page
    res.redirect('/');
  });
});



//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;