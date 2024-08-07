const JWT = require('jsonwebtoken');
const CreateError = require('http-errors');

const redisClient = require('../../../configs/connections_redis');

//
module.exports = {
    signAccessToken: async (userId) => {
        const options = {
            expiresIn: '30m', //10m 10s 10d ...
        };
        return new Promise((resolve, reject) => {
            JWT.sign({ userId }, process.env.ACCESS_TOKEN, options, (err, token) => {
                err && reject(err);
                resolve(token);
            });
        });
    },

    verifyAccessToken: (token) => {
        //decode Access_Token by verify Func
        try {
            const decode = JWT.verify(token, process.env.ACCESS_TOKEN);
            console.log('jwt_service.verifyAccessToken.decode', decode);
            return decode;
        } catch (err) {
            //catch error expired
            if (err.name === 'TokenExpiredError') {
                throw { code: 401, message: err.message };
            } else {
                throw { code: 500, message: err.message };
            }
        }
    },

    signRefreshToken: async (userId) => {
        const options = {
            expiresIn: '1d', //10s 10m 10h 10d...
        };
        return new Promise((resolve, reject) => {
            JWT.sign({ userId }, process.env.REFRESH_TOKEN, options, (err, token) => {
                //
                err && reject(err);
                //set refreshToken into blacklist_Redis, reply return Ok if not err
                redisClient.set(
                    userId.toString(),
                    token,
                    'EX',
                    365 * 24 * 60 * 60,
                    (err, reply) => {
                        if (err) {
                            reject(CreateError.InternalServerError());
                        }
                        resolve(token);
                    },
                );
            });
        });
    },
    //receive refreshToken before (generated from api login)
    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            JWT.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decode) => {
                //
                err && reject(err);

                //get dữ liệu từ redis
                redisClient.get(decode.userId, (err, reply) => {
                    //
                    //reply return value compatible with userId in Redis
                    console.log('jwt_service.verifyRefreshToken', {
                        refreshToken_Login: refreshToken,
                        refreshToken_Redis: reply,
                    });

                    //check err
                    err && reject(CreateError.InternalServerError());

                    //kiểm tra RF truyền vào phải bằng với RF được tạo ra ở API login thì mới trả về decode
                    return refreshToken === reply
                        ? resolve(decode)
                        : reject(CreateError.Unauthorized());
                });
            });
        });
    },
};
