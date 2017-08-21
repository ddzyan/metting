"use strcict"
const logSocketClient = require('../configuration/log4js.js').log_socketClient;

class SocketClient {
    constructor(server) {
        logSocketClient.debug('socketClint 实例化成功');

        //房间管理对象
        const meetingManage = {};

        const io = require('socket.io')(server);
        io.on('connection', function (socket) {
            const send_ip = get_ip_address(socket);
            logSocketClient.debug("connect client ip : ", send_ip);

            //创建用户
            socket.on('createUser', (socket, data) => {
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
                            userObjs: {}
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
                            let rooms = Objects.keys(socket.rooms);
                            console.log(rooms);
                            //io.to('room 237', 'a new user has joined the room'); // broadcast to everyone in the room
                            socket.broadcast.in(rooms).emit('newUserJoin');
                        });
                    }
                    sendSandardMsg(socket, 'create_success', '创建成功', 1);
                } catch (error) {
                    sendSandardMsg(socket, 'create_success', error.message, 0);
                }
            });

            //发送信息
            socket.on('sendMessage', (socket, data) => {
                try {
                    const _userIdArray = data.userIdArray;
                    const _message = data.message;

                    if (socket.rooms && socket.userId) {
                        const roomId = socket.rooms;
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
                        sendSandardMsg(socket, 'sendMessage_success', '发送成功', 1);
                    } else {
                        sendSandardMsg(socket, 'sendMessage_success', '请先加入房间', 0);
                    }
                } catch (error) {
                    sendSandardMsg(socket, 'sendMessage_success', error.message, 0);
                }
            });

            //断开事件
            socket.on('disconnect', (socket) => {
                try {
                    if (socket.rooms && socket.userId) {
                        const roomId = socket.rooms;
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
    static get_ip_address(socket) {
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
    static sendSandardMsg(_socket, _emit, _data, _code) {
        const parm = {
            code: 1,
            message: "200 ok",
            parms: null
        }
        if (_code == 1) {
            parm.parms = _data;
        } else {
            parm.code = _code;
            parm.message = _data;
        }
        logSocketClient.debug({
            _emit: parm
        });
        _socket.emit(_emit, parm);
    }

    //标准返回格式
    /*
    @parm {object} sockey
    @parm {string } 事件名称
    @parm {object}  参数内容
    @parm {bool} 状态值 
    */
    static
}

module.exports = SocketClient;