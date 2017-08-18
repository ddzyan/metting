 /***
  *Created by ddz on 2016/12/26
  */
 //__dirname变量获取当前模块文件所在目录的完整绝对路径
 const Sequelize = require('sequelize');
 const fs = require('fs');
 const path = require('path');
 const dbconfig = require('../../configure/db_config.js').mysql_dev;

 const sequelize = new Sequelize(
 	dbconfig.database, //数据库名称
 	dbconfig.user, //用户名
 	dbconfig.password, //用户密码
 	{
 		'dialect': dbconfig.dialect, //数据库使用mysql
 		'host': dbconfig.host, //数据库IP地址
 		'port': dbconfig.port //数据库服务器使用端口
 	}
 );

 var db = {};
 fs.readdirSync(__dirname)
 	.filter(function (file) { //文件名过滤
 		return (file.indexOf(".") !== 0) && (file !== 'index.js');
 	})
 	.forEach(function (file) {
 		const model = sequelize.import(path.join(__dirname, file)); //用于连接路径。该方法的主要用途在于，会正确使用当前系统的路径分隔符，Unix系统是"/"，Windows系统是"\"。	
 		db[model.name] = model;
 	});

 //建立表间关系




 Object.keys(db).forEach(function (modelName) { //获取所有枚举对象的名称
 	if ("associate" in db[modelName]) {
 		db[modelName].associate(db);
 	}
 });


 db.sequelize = sequelize; //数据库配置
 db.Sequelize = Sequelize; //Sequelize模块

 module.exports = db;