const CreateError = require('http-errors');
const Chat = require('../models/Chat.model');
const User = require('../models/User.model');
//
module.exports = {
    async accessChat(req, res, next) {
        try {
            const { userId } = req.body;
            if (!userId) {
                throw CreateError.BadRequest('userId is not sent with request');
            }
            console.log('accessChat'.blue, { userId, req_user: req.user });

            // tìm kiếm cuộc trò chuyện mà hai người dùng cùng tham gia not group.
            let isChat = await Chat.find({
                isGroupChat: false,
                $and: [
                    { users: { $elemMatch: { $eq: req.user._id } } },
                    { users: { $elemMatch: { $eq: userId } } },
                ],
            })
                .populate('users', '-password')
                .populate('latestMessage');

            //trả về sender với name pic email từ isChat ở trên
            if (isChat) {
                isChat = await User.populate(isChat, {
                    path: 'latestMessage.sender', //path: 'latestMessage.sender', Mongoose sẽ tìm kiếm trường "sender" trong trường "latestMessage" của đối tượng "isChat" và điền thông tin tương ứng vào đó.
                    select: 'name picture email',
                });
            }

            //nếu tồn tại conversation
            if (isChat.length > 0) {
                res.send(isChat[0]);
            }
            //nếu không tồn tại conversation then create chat
            else {
                const createdChat = await Chat.create({
                    chatName: 'Name of groupChat', //user send
                    isGroupChat: false,
                    users: [req.user._id, userId],
                });

                const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                    'users',
                    '-password',
                );
                //trả về thông tin groupChat
                res.status(200).json(FullChat);
            }
        } catch (error) {
            next(error);
        }
    },
    async fetchChats(req, res, next) {
        try {
            Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
                .populate('users', '-password')
                .populate('groupAdmin', '-password')
                .populate('latestMessage')
                .sort({ updatedAt: -1 }) //lấy phần tử mới nhất
                .then(async (results) => {
                    //thông tin người gửi mess cuối cùng
                    results = await User.populate(results, {
                        path: 'latestMessage.sender',
                        select: 'name picture email',
                    });
                    res.status(200).send(results);
                });
        } catch (error) {
            next(error);
        }
    },
    async createGroupChat(req, res, next) {
        try {
            const adminUser = req.user; //người tạo group là myself <=> adminUser
            const { users, name } = JSON.parse(req.body);
            console.log('Create Group Chat'.green, { users, name });

            if (!users || !name) {
                return res.status(400).send({ message: 'Please Fill all the fields' });
            }

            if (users.length < 2) {
                return res.status(400).send('More than 2 users are required to form a group chat');
            }
            users.push(adminUser);

            const groupChat = await Chat.create({
                chatName: name,
                users: users,
                isGroupChat: true,
                groupAdmin: adminUser,
            });

            const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
                .populate('users', '-password')
                .populate('groupAdmin', '-password');
            res.status(200).json(fullGroupChat);
            //
        } catch (error) {
            next(error);
        }
    },
    async renameGroup(req, res, next) {
        const { chatId, chatName } = req.body;

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            {
                chatName,
            },
            {
                new: true, //trả về ob sau update
            },
        )
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        if (!updatedChat) {
            next(CreateError.NotFound('Chat not found'));
        } else {
            res.json(updatedChat);
        }
    },
    async addToGroup(req, res, next) {
        const { chatId, userId } = req.body;

        const added = await Chat.findByIdAndUpdate(
            chatId,
            {
                $push: { users: userId },
            },
            {
                new: true,
            },
        )
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        if (!added) {
            next(CreateError.NotFound('Chat not found'));
        } else {
            res.json(added);
        }
    },
    async removeFromGroup(req, res, next) {
        const { chatId, userId } = req.body;

        const removed = await Chat.findByIdAndUpdate(
            chatId,
            {
                $pull: { users: userId },
            },
            {
                new: true,
            },
        )
            .populate('users', '-password')
            .populate('groupAdmin', '-password');

        if (!removed) {
            next(CreateError.NotFound('Chat not found'));
        } else {
            res.json(removed);
        }
    },
};

/*
    $and để kết hợp các điều kiện trong một mảng.
    $elemMatch để tìm các cuộc trò chuyện có người dùng chứa req.user._id (ID của người dùng hiện tại đang thực hiện yêu cầu).
    $eq được sử dụng để so sánh giá trị của một trường với một giá trị cụ thể.

    User.populate() được sử dụng để kết hợp thông tin từ bộ sưu tập "users" vào kết quả truy vấn.
Đối số đầu tiên (isChat) là đối tượng kết quả truy vấn mà chúng ta muốn kết hợp thông tin vào.

Đối số thứ hai là một đối tượng truyền vào để chỉ định trường và các tùy chọn kết hợp (populate). Trong trường hợp này:

path: 'latestMessage.sender' chỉ định trường "latestMessage.sender" là trường chúng ta muốn kết hợp.

select: 'name pic email' chỉ định các trường "name", "pic", và "email" của người gửi tin nhắn mà chúng ta muốn trả về trong kết quả truy vấn.
    */
