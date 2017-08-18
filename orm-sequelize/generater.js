const SequelizeAuto = require('sequelize-auto');
const dbconfig = require('../configure/db_config.js').mysql_dev;
const auto = new SequelizeAuto(dbconfig.database, dbconfig.user, dbconfig.password, {
    host: dbconfig.host,
    port: dbconfig.port,
    dialect: dbconfig.dialect
});
auto.run(function (err) {
    if (err) throw err;
    console.log(auto.tables); // table list
    console.log(auto.foreignKeys); // foreign key list
});