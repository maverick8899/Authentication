const express = require('express');
const app = express();
const port = 3000;
const createError = require('http-errors');

const client = require('./helpers/connections_redis');
const route = require('./routes');

client.set('foo', 'kim_bang');
client.get('foo', (err, result) => {
    if (err) {
        throw createError.BadRequest();
    }
    console.log(result);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

route(app);

app.listen(port, function () {
    console.log('Listening on port:', port);
});
