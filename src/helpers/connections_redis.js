const redis = require('redis');
const client = redis.createClient({ port: 6379, host: '127.0.0.1', legacyMode: true });

(async function connect() {
    await client.connect();
})();

client.ping((err, pong) => {
    console.log(pong);
});

client.on('connect', () => {
    console.log('--> Redis client connected');
});

client.on('error', (err) => {
    console.log('--> Redis client error: ', err);
});

client.on('ready', (err) => {
    console.log('--> Redis client ready ');
});

module.exports = client;

/*Lỗi "ClientClosedError: The client is closed" xuất hiện khi Redis client đã bị đóng trước khi gửi một yêu cầu Redis. Điều này có thể xảy ra khi client Redis đóng trước khi truy vấn Redis hoàn tất, hoặc khi có lỗi xảy ra trong quá trình truyền tải dữ liệu. */
//=> dùng async await
