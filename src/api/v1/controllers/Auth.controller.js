const CreateError = require('http-errors');
const otpGenerator = require('otp-generator');

const User = require('../models/User.model');
const { userValidate } = require('../helpers/validation');
const JWT = require('../helpers/jwt_service');
const client = require('../../../configs/connections_redis');
const { generateSign } = require('../utils/GenerateSign.util');
const { insertOTP, verifyOTP } = require('../services/OTP.service');
const sendMail = require('../services/sendMail.service');
//
const setAccessTokenCookie = (res, accessToken) => {
    const MAX_ACCESS_TOKEN_AGE = 30_000; //30s
    res.cookie('accessToken', accessToken, {
        signed: true,
        domain: 'localhost',
        sameSite: 'Strict',
        httpOnly: true,
        maxAge: MAX_ACCESS_TOKEN_AGE,
    });
};
const setRefreshTokenCookie = (res, refreshToken) => {
    const MAX_REFRESH_TOKEN_AGE = 3_600_000; //1h
    res.cookie('refreshToken', refreshToken, {
        signed: true,
        domain: 'localhost',
        sameSite: 'Strict',
        httpOnly: true,
        maxAge: MAX_REFRESH_TOKEN_AGE,
    });
};
const refreshTokens = async (res, refreshToken) => {
    const { userId } = await JWT.verifyRefreshToken(refreshToken);
    const newAccessToken = await JWT.signAccessToken(userId);
    const newRefreshToken = await JWT.signRefreshToken(userId);
    //set accessToken into cookie
    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);
    //log
    console.log('UserController.refreshToken:', {
        newAccessToken,
        newRefreshToken,
    });
    return { newAccessToken, newRefreshToken };
};
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
            const { name, email, password, picture } = req.body;

            console.log('register'.yellow, { name, email, password, picture });
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

            const otp = await otpGenerator.generate(6, {
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false,
            });
            req.otp = otp;
            await insertOTP({ otp, email });
            console.log('insertOTP'.blue, { otp, email });
            next();
        } catch (error) {
            next(error);
        }
    },
    verifyOTP: async (req, res, next) => {
        try {
            const { otp, name, email, password, picture } = req.body;
            const { code, elements, message, token } = await verifyOTP({
                otp,
                name,
                email,
                password,
                picture,
            });
            res.status(code).json({
                code,
                elements,
                message,
                token,
            });
        } catch (error) {
            next(error);
        }
    },
    sendOTPMail: async (req, res) => {
        const otp = req.otp;
        const { code, message } = await sendMail(otp);
        res.status(code).json({ code, message });
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

            //set tokens into cookie
            setAccessTokenCookie(res, accessToken);
            setRefreshTokenCookie(res, refreshToken);

            //response to Client
            res.json({ DT: { accessToken, refreshToken }, status: 'success' });
        } catch (error) {
            next(error);
        }
    },
    refreshToken: async (req, res, next) => {
        try {
            //get refreshToken
            const refreshToken = req.signedCookies.refreshToken;
            console.log('User.Controller.refreshToken', refreshToken);
            if (!refreshToken) {
                throw CreateError.BadRequest();
            }

            //refreshToken
            const { newAccessToken, newRefreshToken } = await refreshTokens(res, refreshToken);

            //response to client
            res.json({ DT: { newAccessToken, newRefreshToken }, status: 'success' });
        } catch (error) {
            next(error);
        }
    },
    //api này dùng cho axios nên không thể redirect,axios chỉ gửi nhận data
    logout: async (req, res, next) => {
        try {
            //check refreshToken valid
            const refreshToken = req.signedCookies.refreshToken;
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
            const authorization = req.headers['authorization'];
            console.log('UserController.verifyAccessToken.authorization->', authorization);

            //redirect handle error if authorHeader===null
            if (!authorization) {
                return next(CreateError.Unauthorized());
            }

            //Get Access_Token from authorHeader (Bearer token)
            const accessToken = authorization.split(' ')[1];
            console.log('UserController.verifyAccessToken.accessToken->' + accessToken);

            const decode = JWT.verifyAccessToken(accessToken);
            //bỏ password trả về
            const user = await User.findOne({ _id: decode.userId }).select('-password');
            console.log('UserController.verifyAccessToken.UserQuery', user);

            req.user = user;
            next();
        } catch (error) {
            next(error);
        }
    },
    securityAPI: async (req, res, next) => {
        const checkNonceExists = async (nonce) => {
            return new Promise((resolve, reject) => {
                redisClient.get(`nonce_${nonce}`, (err, reply) => {
                    //reply return value compatible with userId in Redis
                    //check err
                    err && reject(CreateError.InternalServerError());
                    console.log({ nonce, reply });
                    return resolve(nonce === reply ? 'nonce is exists' : false);
                });
            });
        };
        try {
            const { timestamp, sign, nonce } = req.query;
            if (!timestamp || !sign || !nonce) {
                throw CreateError.BadRequest('Bad Request');
            }

            //check nonce exists
            if (await checkNonceExists(nonce)) {
                throw CreateError.Unauthorized(nonceExists);
            }

            //case api reuse after 30s
            const isTime = Math.floor((Date.now() - +timestamp) / 1000);
            if (isTime > 30) {
                throw CreateError.Unauthorized('expired');
            }

            //check sign match
            const signServer = await generateSign(req.query);
            console.log('SecurityAPI', { isTime, sign, signServer });
            if (signServer !== sign) {
                throw CreateError.Unauthorized('sign invalid');
            }

            //Set nonce and next
            redisClient.set(`nonce_${nonce}`, nonce, 'EX', 365 * 24 * 60 * 60, (err, reply) => {
                if (err) {
                    throw CreateError.InternalServerError();
                }
                next();
            });
        } catch (error) {
            next(error);
        }
    },
    checkLogin: async (req, res, next) => {
        //
        console.log('UserController.checkLogin.Cookies', req.cookies);
        console.log('UserController.checkLogin.signedCookies', req.signedCookies);

        const refreshToken = req.signedCookies.refreshToken;
        const accessToken = req.signedCookies.accessToken;
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
                //refreshToken
                const { newAccessToken } = await refreshTokens(res, refreshToken);

                //dispatch to checkRole
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
    async allUsers(req, res) {
        let users = {};
        const keyword = req.query.keyword
            ? {
                  $or: [
                      { name: { $regex: req.query.keyword, $options: 'i' } },
                      //   { email: { $regex: req.query.keyword, $options: 'i' } },
                  ],
              }
            : undefined;
        if (keyword === undefined) {
            users = await User.find();
        } else {
            users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
        }
        res.json(users);
    },
};
//$or là một toán tử trong MongoDB cho phép truy vấn theo nhiều điều kiện.
//$regex được sử dụng để so khớp các chuỗi với một mẫu được chỉ định.
//option i không phân biệt hoa thường
//find({ _id: { $ne: req.user._id } })  Điều kiện này chỉ định rằng _id (ID người dùng) phải khác với req.user._id
