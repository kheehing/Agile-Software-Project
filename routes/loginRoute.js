const express = require('express');
const router = express.Router();

router.get('', (req, res) => {
  res.redirect('/');
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  admin.auth().getUserByEmail(email)
    .then(userRecord => {
      const hashedPassword = userRecord.password;

      bcrypt.compare(password, hashedPassword, (err, result) => {
        if (err) {
          return res.status(500).send('Error verifying password');
        }

        if (result) {
          req.session.userId = userRecord.uid;
          res.status(200).send('Login successful');
        } else {
          res.status(400).send('Invalid credentials');
        }
      });
    }).catch(error => {
      res.status(400).send('Invalid credentials');
    });
});












//  =============================================================
//  ========== Redirect nonexistent MUST BE LAST ROUTE ==========
//  =============================================================

router.get("*", (req, res) => {
  res.status(404).render("404");
});

module.exports = router;