const nodemailer = require('nodemailer');
const mailConf = require('../configuration/configuration_file.js').mail_dev;

const transporter = nodemailer.createTransport({
    service: mailConf.service,
    auth: {
        user: mailConf.user,
        pass: mailConf.pass //授权码,通过QQ获取  
    }
});
const mailEvent = {
    sendMail: (_receiveAddress, _roomId, _callback) => {
        const mailOptions = {
            from: '619262284@qq.com', // 发送者   
            to: _receiveAddress,
            subject: 'SanlogicMeeting 邀请', // 标题  
            text: '点击链接,进入房间:https://61.164.221.4:18081/#/room/' + _roomId, // 文本  
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                _callback(err, null)
            } else {
                _callback(null, '发送成功');
            }
        })
    }
}


module.exports = mailEvent;