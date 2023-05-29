require('dotenv').config();
const router = require('express').Router();
const UserController = require('../controllers/User.controller');
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
} = require('../controllers/Chat.controller');

router.route('/chat').post(UserController.verifyAccessToken, accessChat);
router.route('/chat').get(UserController.verifyAccessToken, fetchChats);
router.route('/group').post(UserController.verifyAccessToken, createGroupChat);
router.route('/rename').put(UserController.verifyAccessToken, renameGroup);
router.route('/group_add').put(UserController.verifyAccessToken, addToGroup);
router.route('/group_remove').put(UserController.verifyAccessToken, removeFromGroup);

module.exports = router;
