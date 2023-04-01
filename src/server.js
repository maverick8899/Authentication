const express = require('express');
const app = express();
const port = 3000;
const createError = require('http-errors');

const client = require('./helpers/connections_redis');
const route = require('./routes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

route(app);

app.listen(port, function () {
    console.log('Listening on port:', port);
});
