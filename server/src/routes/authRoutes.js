const express = require('express');
const controller = require('../controllers/authController');
const { verifyUser } = require('../middleware/authenticate');

const router = express.Router();
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', verifyUser, controller.me);

module.exports = router;
