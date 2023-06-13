'use strict';
const JWT = require('../helpers/jwt_service');
const _OTP = require('../models/OTP.model');
const User = require('../models/User.model');

module.exports = {
    insertOTP: async ({ otp, email }) => {
        try {
            const OTP = new _OTP({ otp, email });
            await OTP.save();
            return OTP ? 1 : 0;
        } catch (error) {
            console.log(`${error}`.red);
        }
    },
    verifyOTP: async ({ otp, name, email, password, picture }) => {
        try {
            console.log('OTP.service_verifyOTP'.blue, { otp, name, email, password, picture });
            const otpHolder = await _OTP.find({ email });
            const lastOTP = otpHolder[otpHolder.length - 1];
            if (!otpHolder.length) {
                return {
                    code: 404,
                    message: 'OTP is expired',
                };
            } else if (email !== lastOTP?.email) {
                return {
                    code: 401,
                    message: 'Email is invalid',
                };
            }
            const validOTP = await lastOTP.isCheckOTP(otp);
            if (!validOTP) {
                return { code: 401, message: 'Invalid OTP' };
            }
            if (email === lastOTP.email) {
                //Stored
                const user = new User({ name, email, password, picture });
                await user.save();
                await _OTP.deleteMany({ email });
                return {
                    code: 201,
                    elements: user,
                    token: await JWT.signAccessToken(user._id),
                };
            } else {
                return {
                    code: 401,
                    message: 'email is invalid',
                };
            }
        } catch (error) {
            console.log(`${error}`.red);
        }
    },
};
