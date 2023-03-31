const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const { TipJSConnection } = require('../../helpers/connections_multi_mongDB');

const UserSchema = new Schema({
    email: { type: String, lowercase: true, unique: true, require: true },
    password: { type: String, require: true },
});

//trước khi save
UserSchema.pre('save', async function (next) {
    try {
        const hashPassword = await bcrypt.hash(this.password, 10);
        this.password = hashPassword;
        next(); //next là hàm async
        console.log(`11111Called before save ::: ${this.email} ${this.password}`);
    } catch (error) {
        next(error);
    }
});

//thêm method cho documents
//truyền password từ body(POST) và this.password từ user tìm thấy từ query
UserSchema.methods.isCheckPassword = async function (password) {
    //encrypted =decoded
    return await bcrypt.compare(password, this.password);
};

module.exports = TipJSConnection.model('user', UserSchema);
//instance allow connect multi store, nếu không dùng đối tượng connections
//module.exports = mongoose.model("user", UserSchema);
