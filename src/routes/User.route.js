const express = require('express');
const router = express.Router();
require('dotenv').config();
const CreateError = require('http-errors');

const User = require('../app/models/User.model');
const { userValidate } = require('../helpers/validation');
const { signAccessToken } = require('../helpers/jwt_service');

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

        res.json({ accessToken });
    } catch (error) {
        next(error);
    }
});

router.get('/', function (req, res) {
    res.send('Welcome to User Page');
});

module.exports = router;
