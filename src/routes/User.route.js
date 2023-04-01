const express = require('express');
const router = express.Router();
require('dotenv').config();
const CreateError = require('http-errors');

const User = require('../app/models/User.model');
const { userValidate } = require('../helpers/validation');
const { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwt_service');

router.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const { error } = userValidate(req.body);
        if (error) {
            throw CreateError(error.details[0].message);
        }

        const isExist = await User.findOne({ email });
        if (isExist) {
            throw CreateError.Conflict(`${email} already exists`);
        }

        const user = new User({ email, password });
        const savedUser = await user.save();

        return res.json({
            status: 'Successfully created',
            element: savedUser,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/refresh_token', async (req, res, next) => {
    try {
        console.log(req.body);
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw CreateError.BadRequest();
        }
        const { userId } = await verifyRefreshToken(refreshToken);

        const newAccessToken = await signAccessToken(userId);
        const newRefreshToken = await signRefreshToken(userId);

        res.json({ newAccessToken, newRefreshToken });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { error } = userValidate(req.body);

        if (error) {
            throw CreateError(error.details[0].message);
        }

        const user = await User.findOne({ email });
        console.log(user);

        if (!user) {
            throw CreateError.NotFound(' not found Email');
        }
        //truyền password từ body(POST) và this.password từ user tìm thấy từ email
        const isMatch = await user.isCheckPassword(password);
        if (!isMatch) {
            throw CreateError.Unauthorized();
        }
        //Create Access_Token
        const accessToken = await signAccessToken(user._id);
        const refreshToken = await signRefreshToken(user._id);

        res.json({ accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
});
router.get('/get_lists', verifyAccessToken, (req, res, next) => {
    const list = [
        {
            email: 'hello1@gmail.com',
        },
        {
            email: 'hello2@gmail.com',
        },
    ];
    res.json({ list });
});

router.get('/', function (req, res) {
    res.send('Welcome to User Page');
});

module.exports = router;
