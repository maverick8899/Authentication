'use strict';
const CreateError = require('http-errors');
const { generateSign } = require('../utils/ReplayAttack.util');

const DATA_USER_EMAIL = [
    { user1: 'email 1' },
    { user2: 'email 2' },
    { user3: 'email 3' },
    { user4: 'email 4' },
    { user5: 'email 5' },
];
const DATA_USER_PASSWORD = [
    { user1: 'password 1' },
    { user2: 'password 2' },
    { user3: 'password 3' },
    { user4: 'password 4' },
    { user5: 'password 5' },
];
module.exports = {
    listUsers: async (req, res, next) => {
        try {
            const { timestamp, sign, nonce, userData } = req.query;
            if (!timestamp || !sign || !nonce) {
                throw CreateError.BadRequest('Bad Request');
            }

            //case api reuse after 30s
            const isTime = Math.floor((Date.now() - +timestamp) / 1000);
            console.log(`${isTime}s`);
            if (isTime > 30) {
                throw CreateError.Unauthorized('expired');
            }

            const signServer = await generateSign(req.query);
            console.log({ sign, signServer });
            if (signServer !== sign) {
                throw CreateError.Unauthorized('sign invalid');
            }

            return res.status(200).json({
                success: true,
                elements: userData === 'email' ? DATA_USER_EMAIL : DATA_USER_PASSWORD,
            });
        } catch (error) {
            next(error);
        }
    },
};
