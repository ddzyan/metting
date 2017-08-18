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
                    }
                    sendSandardMsg(socket, 'create_success', '创建成功', 1);
                } catch (error) {
                    sendSandardMsg(socket, 'create_success', error.message, 0);
                }
            });

            //发送信息
            socket.on('sendMessage', (socket, data) => {
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
                    }
                    sendSandardMsg(socket, 'create_success', '创建成功', 1);
                } catch (error) {
                    sendSandardMsg(socket, 'create_success', error.message, 0);
                }
            });

            //发送文件

            //断开事件
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
        if (_code) {
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
}

module.exports = SocketClient;