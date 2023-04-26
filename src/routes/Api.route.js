const express = require('express');
const JWT = require('../helpers/jwt_service');
const router = express.Router();

router.get('/login', async (req, res) => {
    return res.json({
        status: 'success',
        elements: {
            accessToken: await JWT.signAccessToken('2151050035'),
            refreshToken: await JWT.signRefreshToken(),
        },
    });
});

router.get('/data', JWT.verifyAccessToken, (req, res) => {
    //xử lý decode ở đây, xác thực ở database... đó làm sau
    return res.status(200).json({
        status: 'success',
        elements: [
            {
                data1: 'data1',
            },
            {
                data2: 'data2',
            },
        ],
    });
});
router.get('/refreshToken', async (req, res) => {
    return res.json({
        status: 'success',
        elements: {
            accessToken: await JWT.signAccessToken('2151050035'),
            refreshToken: await JWT.signRefreshToken(),
        },
    });
});

module.exports = router;
