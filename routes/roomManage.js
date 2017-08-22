 "use strict"

 const fs = require('fs');
 const https = require('https');
 const configuration = require('../configuration/configuration_file.js');
 const janusConf = configuration.janus_dev;
 const plugins = configuration.plugins;

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
                     console.log(parm);
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
                                 console.log(parm.plugindata.data.list);
                                 _callback(null, parm.plugindata.data.list);
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
                         console.log(parm);
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
                     if (parm.janus == 'keepalive' || parm.janus == 'event') {
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
     //创建房间
     /*
     @parm 链接地址
     @parm 房间名称
     @parm 时间代码
     @parm 回调函数
     */
     createVedioRoom: (_janusUrl, _transaction, _description, _callback) => {
         try {
             const parms = {
                 janus: "message",
                 transaction: _transaction,
                 body: {
                     bitrate: 128000,
                     is_private: false,
                     ptype: "publisher",
                     publishers: 6,
                     request: "create",
                     description: _description
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
                     display: _display,
                     pin: _pin,
                     ptype: _ptype
                 }
             };
             sendPostHttps(_janusUrl, parms, (error, parm) => {
                 if (error) {
                     _callback(error, null);
                 } else {
                     console.log(parm);
                     if (parm.janus == 'ack') {
                         _callback(null, '加入成功');
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
                 console.log(parm);
                 if (parm.janus == 'ack') {
                     _callback(null, '发送成功');
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
         _callback(e.message, null);
     });

     req.end();
 }

 function strToJson(str) {
     return eval('(' + str + ')');
 }



 module.exports = roomManage;