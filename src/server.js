const app = require('./app');
const { PORT } = process.env;

app.listen(PORT, function () {
    console.log('Listening on port:'.cyan.bold, `${PORT}`.cyan.bold);
});
