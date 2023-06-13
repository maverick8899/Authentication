const router = require('express').Router();
const authController = require('../../controllers/Auth.controller');
const {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
} = require('../../controllers/Chat.controller');
//
router
    .route('/')
    .post(authController.verifyAccessToken, accessChat)
    .get(authController.verifyAccessToken, fetchChats);

router.route('/create_group').post(authController.verifyAccessToken, createGroupChat);
router.route('/rename').put(authController.verifyAccessToken, renameGroup);
router.route('/group_add').put(authController.verifyAccessToken, addToGroup);
router.route('/group_remove').put(authController.verifyAccessToken, removeFromGroup);

module.exports = router;
