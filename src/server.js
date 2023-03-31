const express = require("express");
const route = require("./routes");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

route(app);

app.listen(port, function () {
  console.log("Listening on port:", port);
});
