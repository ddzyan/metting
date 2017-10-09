 "use strict"

 const express = require('express');
 const router = express.Router();
 const co = require('co');
 const sqlEvent = require('../tool/mysql_event.js');
 const crypto = require('crypto');
 const roomManage = require('./roomManage.js');
 const mailEvent = require('../tool/mail_event.js');
 const log4js = require("log4js");

 const logMeeting = log4js.getLogger('log_meeting');
 const privateKey = require('../configuration/configuration_file.js').privateKey;

 router.get('/', (req, res, next) => {
   res.render('index', {
     title: 'sanlogicMeeting'
   });
 });

 router.get('/room_list', (req, res, next) => {
   res.render('room_list');
 });

 router.get('/welcome', (req, res, next) => {
   res.render('welcome');
 });

 //创建janus用户
 router.post('/createJanus', (req, res) => {
   try {
     console.log('createJanus enter');
     const _transaction = req.body.transaction;
     roomManage.createJanus(_transaction, (error, parm) => {
       if (error) {
         sendSandardMsg(res, 0, error);
       } else {
         sendSandardMsg(res, 1, parm);
       }
     });
   } catch (error) {
     sendSandardMsg(res, 0, error.message);
   }
 })

 //删除房间
 router.post('/destroyRoom', (req, res) => {
   try {
     console.log('destroyRoom enter');
     const _janusId = req.body.janusId;
     const _sessionId = req.body.sessionId;
     const _roomId = Number(req.body.roomId);
     const _transaction = req.body.transaction;
     const janusUrl = '/janus/' + _janusId + '/' + _sessionId;
     roomManage.destroyRoom(janusUrl, _transaction, _roomId, (error, parm) => {
       if (error) {
         sendSandardMsg(res, 0, error);
       } else {
         sendSandardMsg(res, 1, '操作成功');
       }
     });
   } catch (error) {
     sendSandardMsg(res, 0, error.message);
   }
 });

 //房间列表
 router.post('/listRoom', (req, res) => {
   try {
     console.log('listRoom enter');
     const _janusId = req.body.janusId;
     const _sessionId = req.body.sessionId;
     const _transaction = req.body.transaction;
     const janusUrl = '/janus/' + _janusId + '/' + _sessionId;
     roomManage.listRoom(janusUrl, _transaction, (error, parm) => {
       if (error) {
         sendSandardMsg(res, 0, error);
       } else {
         sendSandardMsg(res, 1, parm);
       }
     });
   } catch (error) {
     sendSandardMsg(res, 0, error.message);
   }
 })

 //使用vedioRoom插件
 router.post('/usePlugin', (req, res) => {
   try {
     console.log('usePlugin enter');
     const _janusId = req.body.janusId;
     const _transaction = req.body.transaction;
     const _pluginName = req.body.pluginName;
     const _janusUrl = '/janus/' + _janusId;
     const _token = req.body.token;

     roomManage.usePlugin(_janusUrl, _pluginName, _transaction, (error, parm) => {
       if (error) {
         sendSandardMsg(res, 0, error);
       } else {
         sendSandardMsg(res, 1, parm);
       }
     });
   } catch (error) {
     sendSandardMsg(res, 0, error.message);
   }
 })

 //心跳包
 router.post('/keepLive', (req, res) => {
   try {
     console.log('keepLive enter');
     const _janusId = req.body.janusId;
     const _janusUrl = '/janus/' + _janusId + '?';
     const _token = req.body.token;

     const serverToken = crypto.createHash('md5').update(req.session.publicKey + privateKey, 'utf8').digest('hex'); //加密后的密码
     if (serverToken == _token || _token == 'ddzAdmin') {
       roomManage.keepLive(_janusUrl, (error, parm) => {
         if (error) {
           sendSandardMsg(res, 0, error);
         } else {
           sendSandardMsg(res, 1, parm);
         }
       });
     } else {
       sendSandardMsg(res, 2, '请重新登陆');
     }
   } catch (error) {
     sendSandardMsg(res, 0, error.message);
   }
 })

 //查看指定房间用户信息
 router.post('/roomUsersInfo', (req, res) => {
   try {
     console.log('roomUsersInfo enter');
     const _janusId = req.body.janusId;
     const _sessionId = req.body.sessionId;
     const _roomId = Number(req.body.roomId);
     const _transaction = req.body.transaction;
     const janusUrl = '/janus/' + _janusId + '/' + _sessionId;

     roomManage.listparticipants(janusUrl, _transaction, _roomId, (error, parm) => {
       if (error) {
         sendSandardMsg(res, 0, error);
       } else {
         sendSandardMsg(res, 1, parm);
       }
     });
   } catch (error) {
     sendSandardMsg(res, 0, error.message);
   }
 })

 module.exports = router;

 //返回固定格式
 function sendSandardMsg(_res, _code, _parms) {
   const dataMsg = {
     code: _code,
     parms: null,
     msg: '200 ok'
   };

   if (_code === 1) {
     dataMsg.parms = _parms;
   } else {
     dataMsg.msg = _parms;
   }
   console.log(dataMsg);
   _res.json(dataMsg);
 }