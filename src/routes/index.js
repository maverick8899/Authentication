const userRoute = require("./User.route");
const createError = require("http-errors");

function route(app) {
  app.use("/user", userRoute);
}

module.exports = route;
