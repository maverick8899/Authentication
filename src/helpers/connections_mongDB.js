const mongoose = require("mongoose");

mongoose.set("strictQuery", true); //bật chế độ kiểm tra,đọc zalo mongoDB

const connect = mongoose.createConnection("mongodb://127.0.0.1:27017/TipJS");

connect.on("connected", function (error) {
  console.log(`mongoDB ::: Connected ::: ${this.name}`);
});
connect.on("reconnected ", function (error) {
  console.log(`mongoDB ::: Reconnected  ::: ${this.name}`);
});

connect.on("disconnected", function (error) {
  console.log(`mongoDB ::: DisConnected ::: ${this.name}`);
});

connect.on("error", function (error) {
  console.log(`mongoDB ::: Connected ::: ${JSON.stringify(error)}`);
});

process.on("SIGINT", async () => {
  await connect.close();
  process.exit(0);
});

module.exports = connect;
