const express = require('express');
const controller = require('../controllers/authController');
const { verifyUser, verifyAdmin } = require('../middleware/authenticate');

const router = express.Router();
router.get('/', verifyUser, verifyAdmin, controller.listUsers);
router.post('/signup', controller.register);
router.post('/login', controller.login);

module.exports = router;
