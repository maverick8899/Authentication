const express = require('express');
const router = express.Router();
require('dotenv').config();

const { verifyAccessToken } = require('../helpers/jwt_service');
const UserController = require('../controllers/User.controller');

router.post('/register', UserController.register);

router.post('/refresh_token', UserController.refresh);

router.post('/login', UserController.login);

router.delete('/logout', UserController.logout);

router.get('/get_lists', verifyAccessToken, UserController.getLists);

module.exports = router;
