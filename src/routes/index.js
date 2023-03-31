const userRoute = require("./User.route");
const createError = require("http-errors");

function route(app) {
  //
  app.use("/user", userRoute);

  //Case Url not found
  app.use((req, res, next) => {
    next(createError.NotFound("This page does not exist"));
  });
  //nếu có lỗi sẽ tới hàm này và xử lý
  app.use((error, req, res, next) => {
    res.json({
      status: error.status || 500,
      message: error.message,
    });
  });
  app.li;
}

module.exports = route;
