 "use strict"

 const fs = require('fs');
 const https = require('https');
 const configuration = require('../configuration/configuration_file.js');
 const janusConf = configuration.janus_dev;
 const plugins = configuration.plugins;
 const log4js = require("log4js");

 const logMeeting = log4js.getLogger('log_meeting');
 const HOSTNAME = janusConf.hostName;
 const HOSTPORT = janusConf.hostPort;
 const HTTPSKEY = janusConf.httpsKey;
 const HTTPSCERT = janusConf.httpsCert;

 const roomManage = {
     //注销房间
     /*
     @parm 链接地址
     @parm 事物代码
     @parm 房间号码
     @parm 回调函数
     */
     destroyRoom: (_janusUrl, _transaction, _roomId, _callback) => {
         try {
             const parms = {
                 janus: "message",
                 transaction: _transaction,
                 body: {
                     room: _roomId,
                     permanent: true,
                     request: "destroy"
                 }
             };
             sendPostHttps(_janusUrl, parms, (error, parm) => {
                 if (error) {
                     callback(error, null);
                 } else {
                     if (parm.janus == 'success') {
                         _callback(null, '操作成功');
                     } else {
                         _callback('操作失败', null);
                     }
                 }
             });
         } catch (error) {
             _callback(error.message, null);
         }

     },
     //房间列表
     /*
     @parm 链接地址
     @parm 事物代码
     @parm 回调函数
     */
     listRoom: (_janusUrl, _transaction, _callback) => {
         try {
             const parms = {
                 janus: "message",
                 transaction: _transaction,
                 body: {
                     request: "list"
                 }
             };
             sendPostHttps(_janusUrl, parms, (error, parm) => {
                 if (error) {
                     _callback(error, null);
                 } else {
                     if (parm.janus == 'success') {
                         if (parm.plugindata.data.videoroom == 'success') {
                             if (parm.plugindata.data.list) {
                                 const listObject = parm.plugindata.data.list;
                                 let roomInfoArray = [];
                                 for (let i in listObject) {
                                     roomInfoArray.push({
                                         room: listObject[i].room,
                                         description: reconvert(listObject[i].description),
                                         pin_required: listObject[i].pin_required,
                                         max_publishers: listObject[i].max_publishers,
                                         num_participants: listObject[i].num_participants,
                                         record: listObject[i].record
                                     })
                                 }
                                 _callback(null, roomInfoArray);
                             } else {
                                 _callback('操作失败', null);
                             }
                         }
                     } else {
                         _callback('操作失败', null);
                     }
                 }
             });
         } catch (error) {
             _callback(error.message, null);
         }
     },
     //创建用户
     /*
     @parm 链接地址
     @parm 事物代码
     @parm 回调函数
     */
     createJanus: (_transaction, _callback) => {
         try {
             const parms = {
                 janus: "create",
                 transaction: _transaction
             };
             sendPostHttps('/janus', parms, (error, parm) => {
                 if (error) {
                     _callback(error, null);
                 } else {
                     console.log(parm);
                     if (parm.janus == 'success') {
                         _callback(null, parm.data);
                     } else {
                         _callback('操作失败', null);
                     }
                 }
             });
         } catch (error) {
             console.log(error);
             _callback(error.message, null);
         }
     },
     //使用插件
     /*
     @parm 链接地址
     @parm {string } 插件名称
     @parm 事物代码
     @parm 回调函数
     */
     usePlugin: (_janusUrl, _pluginCode, _transaction, _callback) => {
         try {
             const pluginName = plugins[_pluginCode];
             if (pluginName) {
                 const parms = {
                     janus: "attach",
                     transaction: _transaction,
                     "force-bundle": true,
                     "force-rtcp-mux": true,
                     plugin: pluginName
                 };
                 sendPostHttps(_janusUrl, parms, (error, parm) => {
                     if (error) {
                         _callback(error, null);
                     } else {
                         if (parm.janus == 'success') {
                             _callback(null, parm.data);
                         } else {
                             _callback('操作失败', null);
                         }
                     }
                 });
             } else {
                 _callback("插件参数错误", null);
             }
         } catch (error) {
             console.log(error);
             _callback(error.message, null);
         }
     },
     //保持心跳包
     /*
     @parm 链接地址
     @parm 时间
     @parm 回调函数
     */
     keepLive: (_janusUrl, _callback) => {
         try {
             const content = 'rid=' + new Date().getTime() + '&maxev=1';
             sendGetHttps(_janusUrl, content, (error, parm) => {
                 if (error) {
                     _callback(error, null);
                 } else {
                     console.log(parm);
                     _callback(null, parm);
                 }
             });
         } catch (error) {
             _callback(error.message, null);
         }
     },
     //创建房间
     /*
     @parm 链接地址
     @parm 事物代码
     @parm 房间密码
     @parm 房间名称
     @parm 是否记录
     @parm 回调函数
     */
     createVedioRoom: (_janusUrl, _transaction, _pin, _description, _record, _callback) => {
         try {
             const parms = {
                 janus: "message",
                 transaction: _transaction,
                 body: {
                     bitrate: 128000,
                     is_private: false,
                     ptype: "publisher",
                     pin: _pin,
                     publishers: 6,
                     request: "create",
                     record: _record,
                     description: strToUnicode(_description)
                 }
             };
             sendPostHttps(_janusUrl, parms, (error, parm) => {
                 if (error) {
                     _callback(error, null);
                 } else {
                     console.log(parm);
                     if (parm.janus == 'success') {
                         _callback(null, parm.plugindata.data.room);
                     } else {
                         _callback('操作失败', null);
                     }
                 }
             });
         } catch (error) {
             console.log(error);
             _callback(error.message, null);
         }
     },
     /**
     *加入房间 
     *@method joinVedioRoom 
     @parm {String} _janusUrl 链接地址
     @parm {String} _transaction 时间代码
     @parm {String} _display 用户名字
     @parm {Number} _roomId 房间ID
     @parm {String} _pin 房间密码
     @parm {String} _ptype 用户类型
     @parm {Function} _callback 回调函数
     */
     joinVedioRoom: (_janusUrl, _transaction, _display, _roomId, _pin, _ptype, _callback) => {
         try {
             const parms = {
                 janus: "message",
                 transaction: _transaction,
                 body: {
                     request: "join",
                     room: Number(_roomId),
                     display: strToUnicode(_display),
                     pin: _pin,
                     ptype: _ptype
                 }
             };
             sendPostHttps(_janusUrl, parms, (error, parm) => {
                 if (error) {
                     _callback(error, null);
                 } else {
                     if (parm.janus == 'ack') {
                         _callback(null, parm);
                     } else {
                         _callback('操作失败', null);
                     }
                 }
             });
         } catch (error) {
             _callback(error.message, null);
         }
     },
     /**
     *视频配置转发 
     *@method videoConfig 
     @parm {String} _janusUrl 链接地址
     @parm {Object} _transaction 参数
     @parm {Function} _callback 回调函数
     */
     videoConfig: (_janusUrl, _parms, _callback) => {
         sendPostHttps(_janusUrl, _parms, (error, parm) => {
             if (error) {
                 _callback(error, null);
             } else {
                 if (parm.janus == 'ack') {
                     _callback(null, parm);
                 } else {
                     _callback('操作失败', null);
                 }
             }
         });
     },
     /**
     *关闭无效数据通道
     *@method detachData 
     @parm {String} 事物代码 回调函数
     @parm {Function} _callback 回调函数
     */
     detachData: (_janusUrl, _transaction, _callback) => {
         const _parms = {
             janus: "detach",
             transaction: _transaction
         };
         sendPostHttps(_janusUrl, _parms, (error, parm) => {
             if (error) {
                 _callback(error, null);
             } else {
                 if (parm.janus == 'success') {
                     _callback(null, '操作成功');
                 } else {
                     _callback('操作失败', null);
                 }
             }
         });
     },
     /**
     *用户关闭视频流
     *@method hangup 
     @parm {String} 事物代码 回调函数
     @parm {Function} _callback 回调函数
     */
     hangup: (_janusUrl, _transaction, _callback) => {
         const _parms = {
             janus: "hangup",
             transaction: _transaction
         };
         sendPostHttps(_janusUrl, _parms, (error, parm) => {
             if (error) {
                 _callback(error, null);
             } else {
                 if (parm.janus == 'success') {
                     _callback(null, '操作成功');
                 } else {
                     _callback('操作失败', null);
                 }
             }
         });
     },
     /**
     *指定房间用户信息
     *@method listparticipants 
     @parm {String} _janusUrl 链接地址
     @parm {String} _transaction 事物代码
     @parm {Int} _roomId 房间编号
     @parm {Function} _callback 回调函数
     */
     listparticipants: (_janusUrl, _transaction, _roomId, _callback) => {
         const _parms = {
             janus: "message",
             transaction: _transaction,
             body: {
                 room: _roomId,
                 request: "listparticipants"
             }
         };
         sendPostHttps(_janusUrl, _parms, (error, parm) => {
             if (error) {
                 _callback(error, null);
             } else {
                 if (parm.janus == 'success') {
                     _callback(null, parm.plugindata.data);
                 } else {
                     _callback('操作失败', null);
                 }
             }
         });
     },
     /**
     *查看房间是否存在
     *@method exists 
     @parm {String} _janusUrl 链接地址
     @parm {String} _transaction 事物代码
     @parm {Int} _roomId 房间编号
     @parm {Function} _callback 回调函数
     */
     exists: (_janusUrl, _transaction, _roomId, _callback) => {
         const _parms = {
             janus: "message",
             transaction: _transaction,
             body: {
                 room: _roomId,
                 request: "exists"
             }
         };
         sendPostHttps(_janusUrl, _parms, (error, parm) => {
             if (error) {
                 _callback(error, null);
             } else {
                 console.log(parm);
                 if (parm.janus == 'success') {
                     _callback(null, parm.plugindata.data);
                 } else {
                     _callback('操作失败', null);
                 }
             }
         });
     },
     /**
      *踢出指定用户 
      *@method kickOutUser 
     @parm {String} _janusUrl 链接地址
     @parm {String} _transaction 事物代码
     @parm {Int} _roomId 房间编号
     @parm {String} _secret 房间密码
     @parm {Int} _outUserId 踢出用户的janusId
     @parm {Function} _callback 回调函数
      */
     kickOutUser: (_janusUrl, _transaction, _roomId, _secret, _outUserId, _callback) => {
         const _parms = {
             janus: "message",
             transaction: _transaction,
             body: {
                 room: _roomId,
                 secret: _secret,
                 id: _outUserId,
                 request: "kick"
             }
         };
         sendPostHttps(_janusUrl, _parms, (error, parm) => {
             if (error) {
                 _callback(error, null);
             } else {
                 if (parm.janus == 'success') {
                     _callback(null, parm.plugindata.data);
                 } else {
                     _callback('操作失败', null);
                 }
             }
         });
     }
 }

 //post https链接
 /*
 @parm 链接地址
 @parm 参数
 @parm 回调函数
 */
 function sendPostHttps(_url, _pContent, _callback) {
     process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
     const content = JSON.stringify(_pContent);
     const options = {
         hostname: HOSTNAME,
         port: HOSTPORT,
         path: _url,
         method: 'post',
         key: fs.readFileSync(HTTPSKEY),
         cert: fs.readFileSync(HTTPSCERT),
         headers: {
             'Content-Type': 'Application/json;charset=UTF-8',
             "Content-Length": content.length
         },
     };

     //options.agent = new https.Agent(options);
     const req = https.request(options, (res) => {
         res.setEncoding('utf8');

         let data = '';
         res.on('data', (d) => {
             data += d;
         });
         res.on('end', () => {
             if (data) {
                 try {
                     const strJson = strToJson(data);
                     //logMeeting.debug(strJson);
                     _callback(null, strJson);
                 } catch (error) {
                     _callback(error.message, null);
                 }
             } else {
                 _callback('返回值为空', null);
             }
         })
     });

     req.on('error', (e) => {
         logMeeting.error(e.message);
         _callback(e.message, null);
     });

     req.write(content);

     req.end();
 }

 //get https链接
 /*
 @parm 链接地址
 @parm 参数
 @parm 回调函数
 */
 function sendGetHttps(_url, _pContent, _callback) {
     console.log(_url + _pContent);
     process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
     const options = {
         hostname: HOSTNAME,
         port: HOSTPORT,
         path: _url + _pContent,
         method: 'get',
         key: fs.readFileSync(HTTPSKEY),
         cert: fs.readFileSync(HTTPSCERT)
     };

     //options.agent = new https.Agent(options);
     const req = https.request(options, (res) => {
         res.setEncoding('utf8');

         let data = '';
         res.on('data', (d) => {
             data += d;
         });
         res.on('end', () => {
             if (data) {
                 try {
                     const strJson = strToJson(data);
                     //logMeeting.debug(strJson);
                     _callback(null, strJson);
                 } catch (error) {
                     _callback(error.message, null);
                 }
             } else {
                 _callback('返回值为空', null);
             }
         })
     });

     req.on('error', (e) => {
         logMeeting.error(e.message);
         _callback(e.message, null);
     });

     req.end();
 }

 function strToUnicode(str) {
     let _srtUnicode = "\\u";
     for (let i = 0; i < str.length; i++) {
         _srtUnicode += str.charCodeAt(i).toString(16) + '\\u';
     }
     _srtUnicode = _srtUnicode.substring(0, _srtUnicode.length - 2);
     return _srtUnicode;
 }


 function reconvert(str) {
     str = str.replace(/(\\u)(\w{1,4})/gi, function ($0) {
         return (String.fromCharCode(parseInt((escape($0).replace(/(%5Cu)(\w{1,4})/g, "$2")), 16)));
     });
     str = str.replace(/(&#x)(\w{1,4});/gi, function ($0) {
         return String.fromCharCode(parseInt(escape($0).replace(/(%26%23x)(\w{1,4})(%3B)/g, "$2"), 16));
     });
     str = str.replace(/(&#)(\d{1,6});/gi, function ($0) {
         return String.fromCharCode(parseInt(escape($0).replace(/(%26%23)(\d{1,6})(%3B)/g, "$2")));
     });

     return str;
 }


 function strToJson(str) {
     return eval('(' + str + ')');
 }

 module.exports = roomManage;