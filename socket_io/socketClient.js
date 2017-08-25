"use strcict"
const logSocketClient = require('../configuration/log4js.js').log_socketClient;

const socketClientInit = (server) => {
    const io = require('socket.io')(server);
    let meetingManage = {};
    io.on('connection', function (socket) {
        const send_ip = get_ip_address(socket);
        logSocketClient.debug("connect client ip : ", send_ip);

        //创建用户
        socket.on('createUser', (data) => {
            try {
                const _userName = data.userName;
                const _userId = data.userId;
                const _roomName = data.roomName;
                const _roomId = data.roomId;

                //房间不存在,则创建
                if (!meetingManage[_roomId]) {
                    meetingManage[_roomId] = {
                        roomId: _roomId,
                        roomName: _roomName,
                        userObjs: {},
                        msgArray: []
                    };
                }
                //添加用户
                if (!meetingManage[_roomId].userObjs[_userId]) {
                    socket.userId = _userId;
                    meetingManage[_roomId].userObjs[_userId] = {
                        socket: socket,
                        userName: _userName,
                        userId: _userId
                    };

                    socket.join(_roomId, () => {
                        //io.to('room 237', 'a new user has joined the room'); // broadcast to everyone in the room
                        socket.broadcast.in(_roomId).emit('newUserJoin');
                    });
                }

                sendSandardMsg(socket, 'createUser_success', {
                    msgArray: meetingManage[_roomId].msgArray
                }, 1);
            } catch (error) {
                sendSandardMsg(socket, 'createUser_success', error.message, 0);
            }
        });

        //发送信息
        socket.on('sendMessage', (data) => {
            try {
                const _userIdArray = data.userIdArray;
                const _message = data.message;

                if (socket.rooms && socket.userId) {
                    const roomId = Object.keys(socket.rooms)[0];
                    const myObj = meetingManage[roomId].userObjs[socket.userId]

                    if (_userIdArray) {
                        const _userObjs = meetingManage[roomId].userObjs;
                        for (let j = 0; j < _userIdArray.length; j++) {
                            for (let i in _userObjs) {
                                if (_userObjs[i].userId == _userIdArray[j]) {
                                    _userObjs[i].socket.emit('msg', {
                                        message: _message,
                                        userName: myObj.userName,
                                        userId: myObj.userId,
                                        code: 1
                                    });
                                    break;
                                }
                            }
                        }
                    } else {
                        // io.to(socket.rooms, {
                        //     message: _message
                        // });
                        io.to(socket.rooms).emit('msg', {
                            message: _message,
                            userName: myObj.userName,
                            userId: myObj.userId,
                            code: 1
                        });
                    }
                    meetingManage[roomId].messageArray.push({
                        msg: _message,
                        sendUserId: myObj.userId,
                        sendUserName: myObj.userName
                    });
                    sendSandardMsg(socket, 'sendMessage_success', '200 ok', 1);
                } else {
                    sendSandardMsg(socket, 'sendMessage_success', '请先加入一个房间', 0);
                }
            } catch (error) {
                sendSandardMsg(socket, 'sendMessage_success', error.message, 0);
            }
        });

        //发送文件
        

        //断开事件
        socket.on('disconnect', () => {
            try {
                if (socket.rooms && socket.userId) {
                    const roomId = Object.keys(socket.rooms)[0];
                    const myObj = meetingManage[roomId].userObjs[socket.userId]
                    socket.broadcast.in(roomId).emit('msg', {
                        message: myObj.userName + '用户离开了房间',
                        userName: '系统',
                        userId: null,
                        code: 2
                    });

                    delete meetingManage[roomId].userObjs[socket.userId];
                    logSocketClient.debug(myObj.userName + '断开');
                }
            } catch (error) {

            }
        })
    });
}


//***获取指定对象的IP地址
function get_ip_address(socket) {
    var ip_address = socket.handshake.address
    ip_address = ip_address.replace(/\:\:ffff\:/, '').replace(/\:\:1/, '127.0.0.1')
    return ip_address
}

//标准返回格式
/*
@parm {object} sockey
@parm {string } 事件名称
@parm {object}  参数内容
@parm {bool} 状态值 
*/
function sendSandardMsg(socket, emitName, _data, _code) {
    const sendData = {
        code: 1,
        message: "200 ok",
        parms: null
    }
    if (_code == 1) {
        sendData.parms = _data;
    } else {
        sendData.code = _code;
        sendData.message = _data;
    }
    logSocketClient.debug(emitName);
    logSocketClient.debug(sendData);
    socket.emit(emitName, sendData);
}

module.exports = socketClientInit;