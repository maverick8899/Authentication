const express = require('express');
const app = express();
const path = require('path');
const handlebars = require('express-handlebars');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('colors');

const route = require('./api/v1/routes');
//
app.use(cors());
//parse and unlock cookie_lock
app.use(cookieParser(process.env.KEY_SECRET_COOKIE));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'utils')));

app.engine(
    'hbs',
    handlebars.engine({
        extname: '.hbs',
    }),
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'api/v1/views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// đọc các file trong thư mục theo url
// app.use('/assets', express.static(path.join(__dirname, 'helpers', 'test.js')));

app.use(route);

module.exports = app;
