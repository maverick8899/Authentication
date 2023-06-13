const express = require('express');
const router = express.Router();

const chatRoute = require('./Chat.route');
const userRoute = require('./Auth.route');
//
router.use('/auth', userRoute); //testAPI
router.use('/chat', chatRoute); //web login

module.exports = router;
