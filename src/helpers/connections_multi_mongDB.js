const mongoose = require("mongoose");

mongoose.set("strictQuery", true); //bật chế độ kiểm tra,đọc zalo mongoDB

function newConnection(uri) {
  const connect = mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

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

  return connect;
}

const TipJSConnection = newConnection(process.env.URI_MONGODB_TipJS);
//test
// const userConnection = newConnection(process.env.URI_MONGODB_Tiktok);

module.exports = { TipJSConnection };

/*Tùy chọn useNewUrlParser sẽ thông báo cho driver MongoDB sử dụng phiên bản mới nhất của URL parser, giúp giải quyết một số lỗi liên quan đến cú pháp URL.
Tùy chọn useUnifiedTopology sẽ bật chế độ topology mới (dựa trên engine mới) và thay thế cho các chế độ topology cũ. Điều này sẽ giúp đảm bảo rằng các kết nối tới MongoDB sẽ ổn định hơn, đồng thời giúp cho các ứng dụng của bạn có thể sử dụng các tính năng mới nhất của MongoDB driver.
*/
