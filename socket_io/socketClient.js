"use strcict"
const logSocketClient = require('../configuration/log4js.js').log_socketClient;
const roomManage = require('../routes/roomManage.js');

const socketClientInit = (server) => {
    const io = require('socket.io')(server, {
        pingInterval: 10000,
        pingTimeout: 5000, //连接超时时间
        cookie: false
    });
    let mettingManage = {};
    io.on('connection', function (socket) {
        const send_ip = get_ip_address(socket);
        logSocketClient.debug("connect client ip : ", send_ip);

        //创建用户加入房间
        socket.on('createUser', (data) => {
            logSocketClient.debug('createUser enter');
            logSocketClient.debug(data);
            try {
                const userName = data.userName;
                const userId = data.userId;
                const janusId = data.janusId;
                const roomName = data.roomName;
                const roomId = data.roomId;
                const roomType = data.roomType;

                //房间不存在,则创建
                if (!mettingManage[roomId]) {
                    if (roomId) {
                        //创建
                        mettingManage[roomId] = {
                            roomId: roomId,
                            roomName: roomName,
                            allUser: {},
                            publisher: janusId,
                            roomType: roomType,
                            messageArray: []
                        };
                    } else {
                        sendSandardMsg(socket, 'createUser_success', '参数错误', 0);
                        return;
                    }
                }

                //添加用户
                socket.roomId = roomId;
                socket.janusId = janusId;
                if (!mettingManage[roomId].allUser[janusId]) {
                    mettingManage[roomId].allUser[janusId] = {
                        socket: socket,
                        userName: userName,
                        userId: userId,
                        janusId: janusId
                    };

                    socket.join(roomId, () => {
                        socket.to(roomId).emit(userName + '加入了房间');
                    });
                } else {
                    mettingManage[roomId].allUser[janusId].socket = socket;
                }
                sendSandardMsg(socket, 'createUser_success', {
                    roomId: mettingManage[roomId].roomId,
                    roomName: mettingManage[roomId].roomName,
                    publisher: mettingManage[roomId].publisher,
                    roomType: mettingManage[roomId].roomType
                }, 1);
            } catch (error) {
                console.log(error);
                sendSandardMsg(socket, 'createUser_success', error || error.message, 0);
            }
        });

        //发送信息
        socket.on('sendMessage', (data) => {
            try {
                logSocketClient.debug('sendMessage enter');
                logSocketClient.debug(data);
                const janusIds = data.janusIds;
                const message = data.message;

                if (socket.roomId) {
                    //const roomId = Object.keys(socket.roomId)[0];
                    const roomId = socket.roomId;
                    const myObj = mettingManage[roomId].allUser[socket.janusId]

                    if (janusIds) {
                        const allUser = mettingManage[roomId].allUser;
                        for (let j = 0; j < janusIds.length; j++) {
                            for (let i in allUser) {
                                if (allUser[i].janusId == janusIds[j]) {
                                    allUser[i].socket.emit('systemMessage', [{
                                        message: message,
                                        userName: myObj.userName,
                                        janusId: myObj.janusId,
                                        code: 1
                                    }]);
                                    break;
                                }
                            }
                        }
                    } else {
                        io.to(roomId).emit('systemMessage', [{
                            message: message,
                            userName: myObj.userName,
                            janusId: myObj.janusId,
                            code: 1
                        }]);
                    }
                    mettingManage[roomId].messageArray.push({
                        msg: message,
                        sendJanusId: myObj.janusId,
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
                if (socket.roomId && socket.janusId) {
                    const roomId = socket.roomId;
                    const myObj = mettingManage[roomId].allUser[socket.janusId]
                    socket.to(roomId).emit('systemMessage', {
                        message: myObj.userName + '用户离开了房间',
                        userName: '系统',
                        janusId: 0,
                        code: 1
                    });

                    socket.leave(roomId);
                    if (mettingManage[roomId].allUser[socket.janusId]) {
                        delete mettingManage[roomId].allUser[socket.janusId];
                    }


                    if (mettingManage[roomId].length > 0) {
                        const index = Object.keys(mettingManage[roomId].allUser)[0];
                        mettingManage[roomId].publisher = mettingManage[roomId].allUser[index].janusId;
                    } else {
                        //获得session
                        let transaction = Math.random();
                        transaction = Math.random().toString(36).substring(2);
                        const _janusUrl = '/janus/' + myObj.janusId;
                        roomManage.usePlugin(_janusUrl, 'vedioRoom', transaction, (error, parm) => {
                            if (error) {
                                sendSandardMsg(myObj.socket, error, 0);
                            } else {
                                //关闭房间
                                const janusUrl2 = '/janus/' + myObj.janusId + '/' + parm.sessionId;
                                roomManage.destroyRoom(janusUrl2, transaction, roomId, (error, parm) => {
                                    if (error) {
                                        sendSandardMsg(myObj.socket, error, 0);
                                    } else {
                                        sendSandardMsg(myObj.socket, roomId + '房间关闭成功', 1);
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