require('dotenv').config();
const router = require('express').Router();
const UserController = require('../controllers/User.controller');
//
const checkManager = UserController.checkRole('manager');
const checkAdmin = UserController.checkRole('admin');

//Router
router.post('/register', UserController.register);

//Authentication
router.post('/login', UserController.login);

//Authorization
router.get('/home', UserController.checkLogin, (req, res) => {
    res.render('home', { layout: 'home' });
});
router.get(
    '/manager',
    UserController.checkLogin,
    checkManager,
    UserController.renderByRole('manager'),
);
router.get('/admin', UserController.checkLogin, checkAdmin, UserController.renderByRole('admin'));
//
router.get('/refreshToken', UserController.refreshToken);

router.get('/data', UserController.verifyAccessToken, UserController.getLists);

router.delete('/logout', UserController.logout);

module.exports = router;
