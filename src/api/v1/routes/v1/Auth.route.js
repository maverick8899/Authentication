const router = require('express').Router();
const authController = require('../../controllers/Auth.controller');
const limitRequest = require('../../middleWares/limit_req.mw');

//
const checkManager = authController.checkRole('manager');
const checkAdmin = authController.checkRole('admin');
//
router
    .route('/register')
    .get((req, res) => {
        res.render('register', { layout: 'main' });
    })
    .post(limitRequest(2), authController.register, authController.sendOTPMail);

router.post(
    '/login', //authController.securityAPI,
    authController.login,
);
router.route('/verifyOTP').post(authController.verifyOTP);

//Authorization
router.get('/home', authController.checkLogin, (req, res) => {
    res.render('home', { layout: 'home' });
});
router.get(
    '/manager',
    authController.checkLogin,
    checkManager,
    authController.renderByRole('manager'),
);
router.get('/admin', authController.checkLogin, checkAdmin, authController.renderByRole('admin'));
router.get('/refreshToken', authController.securityAPI, authController.refreshToken);
router.get(
    '/data',
    authController.securityAPI,
    authController.verifyAccessToken,
    authController.getLists,
);
router.get('/search', authController.verifyAccessToken, authController.allUsers);

router.delete('/logout', authController.logout);

module.exports = router;
