const express = require('express');
const router = express.Router();
const passport = require('passport');
const { registerUser, loginUser, googleAuthCallback } = require('../controllers/auth.controller');

router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleAuthCallback
);

module.exports = router;
