const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const { connectDB } = require('../../configs/connections_multi_mongDB');

const UserSchema = new Schema({
    email: { type: String, lowercase: true, unique: true, require: true },
    password: { type: String, require: true },
    role: { type: String, enum: ['user', 'manager', 'admin'], default: 'user' },
});

//encode before save
UserSchema.pre('save', async function (next) {
    try {
        const hashPassword = await bcrypt.hash(this.password, 10);
        this.password = hashPassword;
        next(); //next là hàm async
        console.log(`-->Called before save ::: ${this.email} ${this.password}`);
    } catch (error) {
        next(error);
    }
});

//thêm method cho documents
//truyền password từ body(POST) và this.password từ user tìm thấy từ query
//tiến hành băm password và so sánh với password đã băm trong DB
UserSchema.methods.isCheckPassword = async function (password) {
    //encrypted =decoded
    return await bcrypt.compare(password, this.password); // true false
};

module.exports = connectDB.model('account', UserSchema);
//instance allow connect multi store, nếu không dùng đối tượng connections
//module.exports = mongoose.model("user", UserSchema);
