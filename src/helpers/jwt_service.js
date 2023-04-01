const JWT = require('jsonwebtoken');
const CreateError = require('http-errors');

const signAccessToken = async (userId) => {
    const options = {
        expiresIn: '5m', //10m 10s 10d ...
    };
    return new Promise((resolve, reject) => {
        JWT.sign({ userId }, process.env.ACCESS_TOKEN, options, (err, token) => {
            err && reject(err);
            resolve(token);
        });
    });
};

const verifyAccessToken = (req, res, next) => {
    const authorHeader = req.headers['authorization'];
    if (!authorHeader) {
        next(CreateError.Unauthorized);
    }
    //Get Access_Token
    const token = authorHeader.split(' ')[1];
    //verify Access_Token
    //nó decode nếu kết quả không khớp với key ở sign thì trả về lỗi
    JWT.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return next(CreateError.Unauthorized(err.message));
            }
            return next(CreateError.Unauthorized(err.message));
        }
        req.payload = decode;
        next();
    });
};

const signRefreshToken = async (userId) => {
    const options = {
        expiresIn: '1h', //10m 10s 10d ...
    };
    return new Promise((resolve, reject) => {
        JWT.sign({ userId }, process.env.REFRESH_TOKEN, options, (err, token) => {
            err && reject(err);
            resolve(token);
        });
    });
};

const verifyRefreshToken = (refreshToken) => {
    return new Promise((resolve, reject) => {
        JWT.verify(refreshToken, process.env.REFRESH_TOKEN, (err, token) => {
            err && reject(err);
            resolve(token);
        });
    });
};

module.exports = { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken };
