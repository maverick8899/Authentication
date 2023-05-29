const createError = require('http-errors');
const { v4: uuid } = require('uuid'); //tạo id định danh duy nhất => zalo node_express

const logEvents = require('../helpers/logEvents');
const chatRoute = require('./Chat.route');
const userRoute = require('./User.route');
const indexRoute = require('./index.route');

function route(app) {
    //
    app.use('/user', userRoute); //testAPI
    app.use('/api', chatRoute); //web login

    app.use('/', indexRoute);

    // Middleware xử lý các yêu cầu không hợp lệ (page NotFound,...)
    app.use((req, res, next) => {
        next(createError.NotFound('This page does not exist'));
    });

    // Middleware xử lý lỗi 500
    app.use((error, req, res, next) => {
        logEvents(`id: ${uuid()} - ${req.url} - ${req.method} - ${error.message}`);
        res.json({
            status: error.status || error.code || 500,
            message: error.message,
        });
    });
}

module.exports = route;
