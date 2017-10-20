"use strcict"
const logSocketClient = require('../configuration/log4js.js').log_socketClient;
const roomManage = require('../routes/roomManage.js');
const ormDaos = require('../orm-sequelize').daos;
const fs = require('fs');
const path = require('path');

const socketClientInit = (server) => {
    const io = require('socket.io')(server, {
        pingInterval: 10000,
        pingTimeout: 5000, //连接超时时间
        cookie: false
    });
    let mettingManage = {};
    let Files = {};
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
                            publisherId: janusId,
                            publisherName: userName,
                            roomType: roomType,
                            messageArray: []
                        };
                        ormDaos.roomInfoDao.create({
                            roomId: roomId,
                            roomName: roomName,
                            createUserId: userId,
                            roomType: roomType
                        }, (parm) => {
                            console.log('添加成功');
                        })

                        //创建文件夹
                        fs.mkdir(path.join(__dirname, '../meetingFile', roomId + roomName + '/'), (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                fs.mkdir(path.join(__dirname, '../meetingFile', roomId + roomName + '/userFile/'), (err) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log('文件夹创建成功');
                                    }
                                })
                                console.log('文件夹创建成功');
                            }
                        })
                    } else {
                        sendSandardMsg(socket, 'createUser_success', '参数错误', 0);
                        return;
                    }
                }

                //添加用户
                socket.roomId = roomId;
                socket.janusId = janusId;
                socket.userName = userName;
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
                    publisher: mettingManage[roomId].publisherName,
                    roomType: mettingManage[roomId].roomType,
                    issueTime: getNowFormatDate()
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
                                        parm: {
                                            message: message,
                                            userName: myObj.userName,
                                            janusId: myObj.janusId
                                        },
                                        code: 1
                                    }]);
                                    break;
                                }
                            }
                        }
                    } else {
                        io.to(roomId).emit('systemMessage', [{
                            parm: {
                                message: message,
                                userName: myObj.userName,
                                janusId: myObj.janusId
                            },
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
        });

        //会议记录保存
        socket.on('recordMeeting', (data) => {
            try {
                logSocketClient.debug('recordMeeting enter');
                logSocketClient.debug(data);
                const record = data.record;
                const roomId = data.roomId;
                const janusId = data.janusId;

                ormDaos.roomInfoDao.update({
                    roomId: roomId
                }, {
                    record: record
                }, (parm) => {
                    if (parm) {
                        sendSandardMsg(socket, 'recordMeeting_success', '操作成功', 1);
                    } else {
                        sendSandardMsg(socket, 'recordMeeting_success', '保存失败', 0);
                    }
                })
            } catch (error) {
                sendSandardMsg(socket, 'recordMeeting_success', error || error.message, 0);
            }
        });

        //开始上传处理事件
        socket.on('fileStart', (data) => {
            try {
                logSocketClient.debug('fileStart enter');
                logSocketClient.debug(data);
                const roomId = data.roomId;
                const roomName = data.roomName;
                const fileName = data.fileName;
                const receiveJasnusId = data.receiveJasnusId;
                const uploadType = data.uploadType;
                const size = data.fileSize;
                let filePath = '';
                if (uploadType == 'saveRecord') {
                    filePath = path.join(__dirname, '../meetingFile', roomId + roomName + '/');
                } else {
                    filePath = path.join(__dirname, '../meetingFile', roomId + roomName + '/userFile/');
                }
                socket.fileaName = fileName;
                Files[fileName] = {
                    fileSize: size,
                    data: '',
                    downloaded: 0,
                    handler: null,
                    filePath: filePath + fileName,
                    uploadType: uploadType,
                    receiveJasnusId: receiveJasnusId,
                    userfilePath: roomId + roomName + '/userFile/'
                };

                Files[fileName].getPercent = function () {
                    return parseInt((this.downloaded / this.fileSize) * 100);
                };
                Files[fileName].getPosition = function () {
                    return this.downloaded / 524288;
                };
                fs.open(Files[fileName].filePath, 'a', '0777', function (err, fd) {
                    if (err) {
                        sendSandardMsg(socket, "fileStart_success", err.toString(), 0);
                    } else {
                        Files[fileName].handler = fd;
                        socket.emit("moreData", {
                            'position': 0,
                            'percent': 0,
                            'fileName': fileName
                        });
                        sendSandardMsg(socket, "fileStart_success", '操作成功', 1);
                    }
                });
            } catch (error) {
                logSocketClient.error(error);
                sendSandardMsg(socket, "fileStart_success", error || error.message, 0);
            }

        });

        //关闭上传
        socket.on('stopFileUpload', (data) => {
            const fileName = data.fileName;
            fs.close(Files[fileName].handler, function (err) {
                if (err) {
                    console.log("stopFileUpload", '关闭失败:' + err);
                    sendSandardMsg(socket, "stopFileUpload_success", '关闭失败', 0);
                } else {
                    fs_util.del_files(Files[fileName].filePath, function (err) {
                        if (err) {
                            console.log("stopFileUpload", "删除失败:" + err);
                            sendSandardMsg(socket, "stopFileUpload_success", '删除失败', 0);
                        } else {
                            sendSandardMsg(socket, "stopFileUpload_success", '删除成功', 1);
                        }
                    })
                }
            })
        });

        //上传文件
        socket.on('uploadFile', (data) => {
            try {
                const fileName = data.fileName; //文件名称
                const segment = data.segment; //数据流
                const fileObject = Files[fileName];
                fileObject.downloaded += segment.length;
                fileObject.data += segment;

                if (fileObject.downloaded === fileObject.fileSize) {
                    fs.write(fileObject.handler, fileObject.data, null, 'Binary', function (err, written) {
                        //关闭上传
                        fs.close(fileObject.handler, function (err) {
                            if (err) {
                                socket.emit('upload_error', {
                                    msg: err
                                });
                            } else {
                                //完成事件
                                socket.emit('done', {
                                    fileName: fileName
                                });
                                if (Files[fileName].uploadType == 'sendFile') {
                                    if (Files[fileName].receiveJasnusId.length > 0) {
                                        const janusIds = Files[fileName].receiveJasnusId;
                                        const allUser = mettingManage[socket.roomId].allUser;
                                        for (let j = 0; j < janusIds.length; j++) {
                                            for (let i in allUser) {
                                                if (allUser[i].janusId == janusIds[j]) {
                                                    allUser[i].socket.emit('systemMessage', [{
                                                        parm: {
                                                            fileName: fileName,
                                                            filePath: Files[fileName].userfilePath,
                                                            userName: socket.userName,
                                                            janusId: socket.janusId
                                                        },
                                                        code: 2
                                                    }]);
                                                    break;
                                                }
                                            }
                                        }
                                    } else {
                                        io.to(socket.roomId).emit('systemMessage', [{
                                            parm: {
                                                fileName: fileName,
                                                filePath: Files[fileName].userfilePath,
                                                userName: socket.userName,
                                                janusId: socket.janusId
                                            },
                                            code: 2
                                        }]);
                                    }
                                }

                            }
                            delete Files[fileName];
                        });
                    })
                } else if (fileObject.data.length > 10485760) {
                    fs.write(fileObject.handler, fileObject.data, null, 'Binary',
                        function (err, Writen) {
                            fileObject.data = '';
                            socket.emit('moreData', {
                                'position': fileObject.getPosition(),
                                'percent': fileObject.getPercent(),
                                'fileName': fileName
                            })
                        })
                } else {
                    socket.emit("moreData", {
                        'position': fileObject.getPosition(),
                        'percent': fileObject.getPercent(),
                        'fileName': fileName
                    });
                }
            } catch (error) {
                sendSandardMsg(socket, 'uploadFile_success', error || error.message, 0);
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

function getNowFormatDate() {
    const date = new Date();
    const seperator1 = "-";
    const seperator2 = ":";
    let month = date.getMonth() + 1;
    let strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    const currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate + " " + date.getHours() + seperator2 + date.getMinutes() + seperator2 + date.getSeconds();
    return currentdate;
}

module.exports = socketClientInit;