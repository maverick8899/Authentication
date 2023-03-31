const JWT = require('jsonwebtoken');

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

module.exports = { signAccessToken };
