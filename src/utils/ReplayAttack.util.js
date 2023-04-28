const md5 = require('md5');

module.exports = {
    generateSign: (params) => {
        //nonce và timestamp được xác minh ở phần trước
        const keyToken = 'key_public';
        const sortKeys = [];

        params.v = 'v1'; // đổi version thì api cũng không hợp lệ
        params.keyToken = keyToken;

        for (const key in params) {
            key !== 'sign' && sortKeys.push(key);
        }
        let paramsHolder = sortKeys.sort().join(''); //userDataxxxs

        //dùng giá trị này so sánh với sign client gửi lên
        return `${md5(paramsHolder)}`;
    },
};
