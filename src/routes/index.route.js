const router = require('express').Router();
const JWT = require('../helpers/jwt_service');

router.get(
    '/',
    async (req, res, next) => {
        const refreshToken = req.cookies.refreshToken;
        const accessToken = req.cookies.accessToken;
        //nếu không có refreshToken chuyển đến login để tạo tokens
        if (!refreshToken) {
            return next();
        }
        try {
            if (accessToken) {
                //check accessToken nếu còn hạn thì chuyển đến home
                const decode = JWT.verifyAccessToken(accessToken);
                if (decode) {
                    return res.redirect('/user/home');
                }
            }
            //nếu không có accessToken nhưng refreshToken vẫn còn thì làm mới accessToken
            else {
                const { userId } = await JWT.verifyRefreshToken(refreshToken);
                const newAccessToken = await JWT.signAccessToken(userId);
                console.log('indexRoute.refreshToken:', newAccessToken);

                res.cookie('accessToken', newAccessToken, { httpOnly: true, maxAge: 30_000 });
                res.redirect('/user/home');
            }
        } catch (error) {
            //if accessToken or refreshToken invalid
            return next();
        }
    },
    (req, res) => {
        return res.render('index');
    },
);

module.exports = router;
