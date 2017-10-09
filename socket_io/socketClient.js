"use strcict"
const logSocketClient = require('../configuration/log4js.js').log_socketClient;
const roomManage = require('../routes/roomManage.js');

const socketClientInit = (server) => {
    const io = require('socket.io')(server);
    let mettingManage = {};
    io.on('connection', function (socket) {
        const send_ip = get_ip_address(socket);
        logSocketClient.debug("connect client ip : ", send_ip);

        //创建用户加入房间
        socket.on('createUser', (data) => {
            try {
                const _userName = data.userName;
                const _userId = data.userId;
                const _janusId = data.janusId;
                const _roomName = data.roomName;
                const _roomId = data.roomId;
                const _roomType = data.roomType;

                //房间不存在,则创建
                if (!mettingManage[_roomId]) {
                    if (_roomId) {
                        //创建
                        mettingManage[_roomId] = {
                            roomId: _roomId,
                            roomName: _roomName,
                            allUser: {},
                            publisher: _userId,
                            roomType: _roomType
                        };
                    } else {
                        sendSandardMsg(socket, 'createUser_success', '参数错误', 0);
                        return;
                    }
                }

                //添加用户
                socket.roomId = _roomId;
                socket.userId = _userId;
                if (!mettingManage[_roomId].allUser[_userId]) {
                    mettingManage[_roomId].allUser[_userId] = {
                        socket: socket,
                        userName: _userName,
                        userId: _userId,
                        janusId: _janusId
                    };

                    socket.join(_roomId, () => {
                        socket.to(_roomId).emit(_userName + '加入了房间');
                    });
                } else {
                    mettingManage[_roomId].allUser[_userId].socket = socket;
                }
                sendSandardMsg(socket, 'createUser_success', {
                    roomId: mettingManage[_roomId].roomId,
                    roomName: mettingManage[_roomId].roomName,
                    publisher: mettingManage[_roomId].publisher,
                    roomType: mettingManage[_roomId].roomType
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
                    const myObj = mettingManage[roomId].allUser[socket.userId]

                    if (_userIdArray) {
                        const _userObjs = mettingManage[roomId].allUser;
                        for (let j = 0; j < _userIdArray.length; j++) {
                            for (let i in _userObjs) {
                                if (_userObjs[i].userId == _userIdArray[j]) {
                                    _userObjs[i].socket.emit('systemMessage', {
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
                        io.to(socket.rooms).emit('systemMessage', {
                            message: _message,
                            userName: myObj.userName,
                            userId: myObj.userId,
                            code: 1
                        });
                    }
                    mettingManage[roomId].messageArray.push({
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

        //断开事件
        socket.on('disconnect', () => {
            try {
                if (socket.rooms && socket.userId) {
                    const _roomId = socket.roomId;
                    const myObj = mettingManage[_roomId].allUser[socket.userId]
                    socket.to(roomId).emit('msg', {
                        message: myObj.userName + '用户离开了房间',
                        userName: '系统',
                        userId: null,
                        code: 2
                    });

                    socket.leave(roomId);
                    delete mettingManage[roomId].userObjs[socket.userId];

                    if (mettingManage[roomId].length > 0) {
                        const index = Object.keys(mettingManage[_roomId].allUser)[0];
                        mettingManage[_roomId].publisher = mettingManage[roomId].allUser[index].userId;
                    } else {
                        //获得session
                        let _transaction = Math.random();
                        _transaction = Math.random().toString(36).substring(2);
                        const _janusUrl = '/janus/' + myObj._janusId;
                        roomManage.usePlugin(_janusUrl, 'vedioRoom', _transaction, (error, parm) => {
                            if (error) {
                                sendSandardMsg(myObj.socket, error, 0);
                            } else {
                                //关闭房间
                                const janusUrl2 = '/janus/' + myObj._janusId + '/' + parm.sessionId;
                                roomManage.destroyRoom(janusUrl2, _transaction, _roomId, (error, parm) => {
                                    if (error) {
                                        sendSandardMsg(myObj.socket, error, 0);
                                    } else {
                                        sendSandardMsg(myObj.socket, _roomId + '房间关闭成功', 1);
                                    }
                                });
                            }
                        });
                    }
                    logSocketClient.debug(myObj.userName + '断开');
                }
            } catch (error) {
                logSocketClient.debug(error);
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