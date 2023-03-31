const JWT = require('jsonwebtoken');
const CreateError = require('http-errors');

const signAccessToken = async (userId) => {
    const options = {
        expiresIn: '1h', //10m 10s 10d ...
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
    const token = authorHeader.split(' ')[1];
    console.log(token);

    //verifyAccessToken
    JWT.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
        if (err) {
            next(CreateError.Unauthorized());
        }
        req.payload = decode;
        next();
    });
};

module.exports = { signAccessToken, verifyAccessToken };
