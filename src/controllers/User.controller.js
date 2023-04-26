const CreateError = require('http-errors');

const User = require('../app/models/User.model');
const { userValidate } = require('../helpers/validation');
const JWT = require('../helpers/jwt_service');
const redisClient = require('../configs/connections_redis');
//
const MAX_ACCESS_TOKEN_AGE = 30_000; //30s
const MAX_REFRESH_TOKEN_AGE = 3_600_000; //1h
const renderManager = (req, res, next) => {
    res.render('manager', { layout: 'home' });
};

const renderAdmin = (req, res, next) => {
    res.render('admin', { layout: 'home' });
};
//
module.exports = {
    register: async (req, res, next) => {
        try {
            const { email, password, role } = req.body;

            //Validate
            const { error } = userValidate(req.body);
            if (error) {
                throw CreateError(error.details[0].message);
            }
            //Check Exists
            const isExist = await User.findOne({ email });
            if (isExist) {
                throw CreateError.Conflict(`${email} already exists`);
            }
            //Stored
            const user = new User({ email, password, role });
            await user.save();

            //response to Client
            return res.json({
                status: 'success',
                element: user,
            });
        } catch (error) {
            next(error);
        }
    },
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            console.log('User.Controller.login', { email, password });

            //validate
            const { error } = userValidate(req.body);
            if (error) {
                throw CreateError(error.details[0].message);
            }

            //check exists email
            const user = await User.findOne({ email });
            if (!user) {
                throw CreateError.NotFound('Not found Email');
            }
            console.log('User.Controller.login', user);

            //compare the password in(API post login) with the password just found in DB
            const isMatch = await user.isCheckPassword(password);
            if (!isMatch) {
                throw CreateError.Unauthorized();
            }

            //Create Tokens
            const accessToken = await JWT.signAccessToken(user._id);
            const refreshToken = await JWT.signRefreshToken(user._id);
            console.log('User.Controller.login', { accessToken, refreshToken });

            //set cookie
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                maxAge: MAX_ACCESS_TOKEN_AGE,
            }).cookie('refreshToken', refreshToken, {
                httpOnly: true,
                maxAge: MAX_REFRESH_TOKEN_AGE,
            });
            //response to Client
            res.json({ DT: { accessToken, refreshToken }, status: 'success' });
        } catch (error) {
            next(error);
        }
    },

    refreshToken: async (req, res, next) => {
        try {
            //get refreshToken
            const refreshToken = req.cookies.refreshToken;
            console.log('User.Controller.refreshToken', refreshToken);
            if (!refreshToken) {
                throw CreateError.BadRequest();
            }

            //Check refreshToken valid ?
            const { userId } = await JWT.verifyRefreshToken(refreshToken);
            const newAccessToken = await JWT.signAccessToken(userId);

            console.log('User.Controller.refreshToken', { newAccessToken });
            //response to client
            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                maxAge: MAX_ACCESS_TOKEN_AGE,
            });
            res.json({ DT: { newAccessToken }, status: 'success' });
        } catch (error) {
            next(error);
        }
    },
    //api này dùng cho axios nên không thể redirect,axios chỉ gửi nhận data
    logout: async (req, res, next) => {
        try {
            //check refreshToken valid
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) throw CreateError.BadRequest();

            //kiểm tra xem refreshToken có hợp lệ không, néu hợp lệ thì decode => userId
            const { userId } = await JWT.verifyRefreshToken(refreshToken);

            //proceed delete in Redis
            //reply: amount keys deleted
            redisClient.del(userId.toString(), (err, reply) => {
                //
                err && reject(CreateError.InternalServerError());

                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                res.status(200).json({ success: true, message: 'logout success!' });
            });
        } catch (error) {
            next(error);
        }
    },
    getLists: (req, res, next) => {
        const list = [{ data1: 'data1' }, { data2: 'data2' }];
        res.json({ list });
    },
    //Dùng cho Axios có auth ở headers
    verifyAccessToken: async (req, res, next) => {
        try {
            //get value key authorization form headers
            const authorHeader = req.headers['authorization'];
            console.log('UserController.verifyAccessToken.authorHeader->', authorHeader);

            //redirect handle error if authorHeader===null
            if (!authorHeader) {
                return next(CreateError.Unauthorized());
            }

            //Get Access_Token from authorHeader (Bearer token)
            const token = authorHeader.split(' ')[1];
            console.log('UserController.verifyAccessToken.accessToken->' + token);

            const decode = JWT.verifyAccessToken(token);
            const user = await User.findOne({ _id: decode.userId });
            console.log('UserController.verifyAccessToken.UserQuery', user);

            next();
        } catch (error) {
            next(error);
        }
    },
    checkLogin: async (req, res, next) => {
        //
        console.log('UserController.checkLogin.Cookies', req.cookies);
        const refreshToken = req.cookies.refreshToken;
        const accessToken = req.cookies.accessToken;
        //
        const getUserFromAccessToken = async (accessToken) => {
            const decode = JWT.verifyAccessToken(accessToken);
            const user = await User.findOne({ _id: decode.userId });
            return user;
        };
        try {
            //khi refreshToken trong cookie hết hạn sẽ mất, redirect sang login để lấy lại tokens
            if (!refreshToken) {
                return res.redirect('/');
            }
            //decode to dispatch next Middleware
            if (accessToken && refreshToken) {
                //send to checkRole
                req.payload = await getUserFromAccessToken(accessToken);
            } else if (!accessToken) {
                const { userId } = await JWT.verifyRefreshToken(refreshToken);
                const newAccessToken = await JWT.signAccessToken(userId);
                console.log('UserController.checkLogin.refreshToken:', newAccessToken);

                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    maxAge: MAX_ACCESS_TOKEN_AGE,
                });

                //send to checkRole
                req.payload = await getUserFromAccessToken(newAccessToken);
            }
        } catch (error) {
            //if accessToken or refreshToken invalid
            return res.redirect('/');
        }
        // Gọi next() ở cuối middleware
        return next();
    },
    checkRole: (role) => {
        return (req, res, next) => {
            //kiểm tra role có tồn tại hay không, tối ưu hơn so với try_catch
            if (req.payload.role && req.payload.role === role) {
                next();
            } else {
                next(CreateError.Unauthorized());
            }
        };
    },
    renderByRole: (role) => {
        const handlers = {
            manager: renderManager,
            admin: renderAdmin,
        };

        return (req, res, next) => {
            handlers[role](req, res, next);
        };
    },
};
