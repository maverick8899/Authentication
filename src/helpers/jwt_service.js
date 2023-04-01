const JWT = require('jsonwebtoken');
const CreateError = require('http-errors');

const client = require('./connections_redis');

const signAccessToken = async (userId) => {
    const options = {
        expiresIn: '20s', //10m 10s 10d ...
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
        next(CreateError.Unauthorized());
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
        expiresIn: '1d', //10m 10s 10d ...
    };
    return new Promise((resolve, reject) => {
        JWT.sign({ userId }, process.env.REFRESH_TOKEN, options, (err, token) => {
            //set lại refreshToken trong blacklist
            client.set(userId.toString(), token, 'EX', 365 * 24 * 60 * 60, (err, reply) => {
                if (err) {
                    reject(CreateError.InternalServerError());
                }
                resolve(token);
            });
        });
    });
};

const verifyRefreshToken = (refreshToken) => {
    return new Promise((resolve, reject) => {
        JWT.verify(refreshToken, process.env.REFRESH_TOKEN, (err, payload) => {
            err && reject(err);

            //get dữ liệu từ redis
            client.get(payload.userId, (err, reply) => {
                console.log({ refreshToken_Login: refreshToken, refreshToken_Redis: reply });
                //check err
                if (err) {
                    reject(CreateError.InternalServerError());
                }
                //refreshToken phải bằng value của key userId thì mới trả về decode
                if (refreshToken === reply) {
                    return resolve(payload);
                } else {
                    reject(CreateError.Unauthorized());
                }
                //trường hợp key-value in redis hết hạn
            });
        });
    });
};

module.exports = { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken };
