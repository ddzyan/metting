module.exports = {
    mysql_dev: {
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: '9824hfgdaf',
        //password: '123456',
        database: 'metting',
        connectionLimit: 10,
        supportBigNumbers: true,
        charset: 'utf8',
        dialect: 'mysql'
    },
    mail_dev: {
        service: 'qq',
        user: '619262284@qq.com',
        pass: 'yisyflazjvbebbbh'
    },
    janus_dev: {
        //hostName: 'localhost',
        hostName: '192.168.20.211',
        hostPort: 8089,
        httpsKey: './certs/mycert.key',
        httpsCert: './certs/mycert.pem'
    },
    privateKey: 'sanlogicMeeting_19',
    plugins: {
        "vedioRoom": "janus.plugin.videoroom"
    }
};