const CreateError = require('http-errors');

const User = require('../app/models/User.model');
const { userValidate } = require('../helpers/validation');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwt_service');
const client = require('../helpers/connections_redis');

module.exports = {
    register: async (req, res, next) => {
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
    },
    refresh: async (req, res, next) => {
        try {
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
    },
    login: async (req, res, next) => {
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
    },
    logout: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw CreateError.BadRequest();
            }
            const { userId } = await verifyRefreshToken(refreshToken);
            client.del(userId.toString(), (err, reply) => {
                if (err) {
                    reject(CreateError.InternalServerError());
                }
                res.json({
                    message: 'logout >>>',
                });
            });
        } catch (error) {
            next(error);
        }
    },
    getLists: (req, res, next) => {
        const list = [
            {
                email: 'hello1@gmail.com',
            },
            {
                email: 'hello2@gmail.com',
            },
        ];
        res.json({ list });
    },
};
