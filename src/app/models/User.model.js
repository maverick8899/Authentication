const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { TipJSConnection } = require("../../helpers/connections_multi_mongDB");

const UserSchema = new Schema({
  username: { type: String, lowercase: true, unique: true, require: true },
  password: { type: String, require: true },
});

module.exports = TipJSConnection.model("user", UserSchema);
