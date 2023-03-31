const Joi = require("joi");

const userValidate = (data) => {
  //Định nghĩa dữ liệu đưa vào
  const userSchema = Joi.object({
    email: Joi.string()
      .email()
      .pattern(new RegExp("gmail.com"))
      .lowercase()
      .required(),
    password: Joi.string().min(4).max(32).required(),
  });
  //validate
  return userSchema.validate(data);
};

module.exports = { userValidate };

// Nếu dữ liệu không hợp lệ, validate sẽ trả về một đối tượng với hai thuộc tính value (giá trị null) và error (một đối tượng lỗi mô tả lỗi của dữ liệu không hợp lệ).
