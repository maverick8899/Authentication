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
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(this.password, salt);
        this.password = hashPassword;
        next();
        console.log(`Called before save ::: ${this.email} ${this.password}`);
    } catch (error) {
        next(error);
    }
});

//thêm method cho documents
UserSchema.methods.isCheckPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = TipJSConnection.model('user', UserSchema);
//instance allow connect multi store, nếu không dùng đối tượng connections
//module.exports = mongoose.model("user", UserSchema);
