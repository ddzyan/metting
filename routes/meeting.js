 "use strict"

 const express = require('express');
 const router = express.Router();
 const co = require('co');
 const sqlEvent = require('../tool/mysql_event.js');
 const crypto = require('crypto');
 const roomManage = require('./roomManage.js');
 const mailEvent = require('../tool/mail_event.js');
 const logMeeting = require("../configuration/log4js.js").log_meeting;

 const privateKey = require('../configuration/configuration_file.js').privateKey;

 //验证token信息
 function checkToken(req, res, next) {
     const _token = req.body.token;

     const serverToken = crypto.createHash('md5').update(req.session.publicKey + privateKey, 'utf8').digest('hex'); //加密后的密码
     if (serverToken == _token || _token == 'ddzAdmin') {
         next();
     } else {
         sendSandardMsg(res, 2, '请重新登陆');
     }
 }

 //登录
 router.post('/signin', (req, res) => {
     try {
         logMeeting.debug('signin enter');
         console.log(req.url);
         const _account = req.body.account;
         //const _password = crypto.createHash('md5').update(req.body.password, 'utf8').digest('hex'); //加密后的密码
         const _password = req.body.password;
         const _autoLogin = req.body.autoLogin;

         co(function* () {
             const inquiryAccount = yield sqlEvent.executeQuery(
                 'select * from user_info where account = "' + _account + '"' + ' and password="' + _password + '"'
             );
             if (inquiryAccount.code === 1) {
                 if (inquiryAccount.count > 0) {
                     if (_autoLogin) {
                         req.session.userId = inquiryAccount.rows[0].id;
                     }
                     crypto.randomBytes(16, function (ex, buf) {
                         const token = buf.toString('hex');
                         req.session.publicKey = token;
                         sendSandardMsg(res, 1, {
                             id: inquiryAccount.rows[0].id,
                             publicKey: token
                         });
                     });

                 } else {
                     sendSandardMsg(res, 0, '帐号或密码错误,请重新输入');
                 }
             } else {
                 sendSandardMsg(res, 0, inquiryAccount.message);
             }
         }).catch(function (err) {
             throw {
                 message: err
             };
         })
     } catch (error) {
         sendSandardMsg(res, 0, error.message);
     }
 });

 //注册
 router.post('/signup', (req, res) => {
     try {
         logMeeting.debug('signup enter');
         const _account = req.body.account;
         //const _password = crypto.createHash('md5').update(req.body.password, 'utf8').digest('hex'); //加密后的密码
         const _password = req.body.password;
         if (_account.length < 35) {
             co(function* () {
                 const inquiryAccount = yield sqlEvent.executeQuery(
                     'select * from user_info where account = "' + _account + '"'
                 );
                 if (inquiryAccount.code == 1) {
                     if (inquiryAccount.count > 0) {
                         sendSandardMsg(res, false, '帐号已存在,请重新输入');
                     } else {
                         const createUser = yield sqlEvent.executeInsert(
                             'Insert into user_info set?', {
                                 account: _account,
                                 password: _password
                             }
                         );
                         if (createUser.code === 1) {
                             sendSandardMsg(res, 1, '注册成功');
                         } else {
                             sendSandardMsg(res, 0, '帐号创建失败,请重新再试');
                         }
                     }
                 } else {
                     sendSandardMsg(res, 0, inquiryAccount.message);
                 }
             }).catch(function (error) {
                 throw error;
             })
         } else {
             throw {
                 message: '帐号需要小于35位'
             };
         }
     } catch (error) {
         sendSandardMsg(res, 0, error.message);
     }
 });

 //自动登录
 router.get('/autoLogin', (req, res) => {
     try {
         logMeeting.debug('autoLogin enter');
         if (req.session.userId && req.session.publicKey) {
             sendSandardMsg(res, 1, {
                 id: req.session.userId,
                 publicKey: req.session.publicKey
             });
         } else {
             sendSandardMsg(res, 2, '请先登录');
         }
     } catch (error) {
         sendSandardMsg(res, 0, error.message);
     }
 })

 //创建房间
 router.post('/createVedioRoom', checkToken, (req, res) => {
     try {
         logMeeting.debug('createVedioRoom enter');
         const _janusId = req.body.janusId;
         const _transaction = req.body.transaction;
         const _sessionId = req.body.sessionId;
         const _description = req.body.description;

         const janusUrl = '/janus/' + _janusId + '/' + _sessionId;
         roomManage.createVedioRoom(janusUrl, _transaction, _description, (error, parm) => {
             if (error) {
                 sendSandardMsg(res, 0, error);
             } else {
                 sendSandardMsg(res, 1, {
                     roomId: parm
                 });
             }
         })

     } catch (error) {
         sendSandardMsg(res, 0, error.message);
     }
 })

 //加入房间
 router.post('/joinVedioRoom', checkToken, (req, res) => {
     try {
         logMeeting.debug('joinVedioRoom enter');
         const _janusId = req.body.janusId;
         const _transaction = req.body.transaction;
         const _sessionId = req.body.sessionId;
         const _display = req.body.display;
         const _roomId = Number(req.body.roomId);
         const _pin = req.body.pin;
         const _ptype = req.body.ptype;

         const janusUrl = '/janus/' + _janusId + '/' + _sessionId;
         roomManage.joinVedioRoom(janusUrl, _transaction, _display, _roomId, _pin, _ptype, (error, parm) => {
             if (error) {
                 sendSandardMsg(res, 0, error);
             } else {
                 sendSandardMsg(res, 1, '操作成功');
             }
         });
     } catch (error) {
         sendSandardMsg(res, 0, error.message);
     }
 })

 //发送邀请邮件
 router.post('/invitationToMail', checkToken, (req, res) => {
     try {
         logMeeting.debug('invitationToMail enter');
         //邮件内容
         const _receiveAddress = req.body.receiveAddress;
         const _roomId = req.body.roomId;
         mailEvent.sendMail(_receiveAddress, _roomId, (error, parm) => {
             if (error) {
                 sendSandardMsg(res, 0, error);
             } else {
                 sendSandardMsg(res, 1, parm);
             }
         })

     } catch (error) {
         sendSandardMsg(res, 1, error.message);
     }
 })

 //视频配置
 router.post('/videooRoomConfig', checkToken, (req, res) => {
     try {
         const _videoConfig = req.body.videoConfig;
         const _janusId = req.body.janusId;
         const _sessionId = req.body.sessionId;

         const janusUrl = '/janus/' + _janusId + '/' + _sessionId;
         roomManage.videoConfig(janusUrl, _videoConfig, (error, parm) => {
             if (error) {
                 sendSandardMsg(res, 0, error);
             } else {
                 sendSandardMsg(res, 1, '操作成功');
             }
         });
     } catch (error) {
         sendSandardMsg(res, 1, error.message);
     }
 })

 //关闭无效数据通道
 router.post('/detach', checkToken, (req, res) => {
     try {
         logMeeting.debug('detachData enter');
         const _janusId = req.body.janusId;
         const _sessionId = req.body.sessionId;
         const _transaction = req.body.transaction;

         const janusUrl = '/janus/' + _janusId + '/' + _sessionId;
         roomManage.detachData(janusUrl, _transaction, (error, parm) => {
             if (error) {
                 sendSandardMsg(res, 0, error);
             } else {
                 sendSandardMsg(res, 1, '操作成功');
             }
         });
     } catch (error) {
         sendSandardMsg(res, 1, error.message);
     }
 })

 //用户退出
 router.post('/hangup', checkToken, (req, res) => {
     try {
         logMeeting.debug('hangup enter');
         const _janusId = req.body.janusId;
         const _sessionId = req.body.sessionId;
         const _transaction = req.body.transaction;

         const janusUrl = '/janus/' + _janusId + '/' + _sessionId;
         roomManage.hangup(janusUrl, _transaction, (error, parm) => {
             if (error) {
                 sendSandardMsg(res, 0, error);
             } else {
                 sendSandardMsg(res, 1, '操作成功');
             }
         });
     } catch (error) {
         sendSandardMsg(res, 1, error.message);
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
     logMeeting.debug(dataMsg);
     _res.json(dataMsg);
 }