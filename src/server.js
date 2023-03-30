const express = require("express");
const route = require("./routes");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

route(app);
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
app.listen(port, function () {
  console.log("Listening on port:", port);
});
