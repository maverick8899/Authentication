const router = require('express').Router();
const indexController = require('../controllers/index.controller');

router.get('/', indexController.checkLogin, indexController.pageLogin);
router.get('/register', (req, res) => {
    res.render('register', { layout: 'main' });
});

module.exports = router;
