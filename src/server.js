const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const route = require('./routes');
const handlebars = require('express-handlebars');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.engine(
    'hbs',
    handlebars.engine({
        extname: '.hbs',
    }),
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

route(app);

app.listen(port, function () {
    console.log('Listening on port:', port);
});
