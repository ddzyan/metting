const mysqlConf = require("../configuration/configuration_file.js").mysql_dev;
const mysql = require("mysql");

const pool = mysql.createPool({
    host: mysqlConf.host,
    user: mysqlConf.user,
    port: mysqlConf.port,
    password: mysqlConf.password,
    port: mysqlConf.port,
    database: mysqlConf.database,
    charset: 'UTF8', //BIG5_CHINESE_CI default: UTF8_GENERAL_CI
    typeCast: false
});

//sql方法
const sqlEvent = {
    /*查询
    @parm条件
    */
    executeQuery: function (sql) {
        return function (callback) {
            query(sql, callback);
        };
    },
    /*添加
    @parm条件
    @parm参数
    */
    executeInsert: function (sql, param) {
        return function (callback) {
            insert(sql, param, callback);
        };
    },
    /*更新
    @parm条件
    @parm参数
    */
    executeUpdate: function (sql, arr) {
        return function (callback) {
            update(sql, arr, callback);
        }
    },
    /*删除
    @parm条件
    @parm参数
    */
    executeDelete: function (sql, param) {
        return function (callback) {
            deleteB(sql, param, callback);
        }
    }
}


function query(sql, callback) {
    //建立连接
    pool.getConnection(function (err, connection) {
        if (err) {
            callback(null, {
                code: 0,
                message: err
            });
        } else {
            //connection.query("set names utf8;");
            connection.query({
                sql: sql,
                typeCast: true
            }, function (error, result) {
                if (error) {
                    callback(null, {
                        code: 0,
                        message: err
                    });
                    connection.destroy();
                } else {
                    callback(null, {
                        code: 1,
                        count: result.length,
                        rows: result
                    });
                    connection.destroy();
                }
            });
        }
    });
}

function insert(sql, param, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            callback(null, {
                code: 0,
                message: err.message
            });
            connection.destroy();
        } else {
            // connection.query("set names utf8;");
            connection.query(sql, param, function (err, results) {
                if (err) {
                    callback(null, {
                        code: 0,
                        message: err.message
                    });
                    connection.destroy();
                } else {
                    callback(null, {
                        code: 1,
                        message: "success",
                        insertId: results.insertId
                    });
                    connection.destroy();
                }
            });
        }
    });
}


function update(sql, arr, callback) {

    pool.getConnection(function (err, connection) {
        // Use the connection
        connection.query(sql, arr, function (err, rows) {
            if (err) {
                connection.rollback(function () {
                    console.log(err);
                    var str = {
                        code: 0,
                        message: err.message
                    };
                    callback(null, str);
                    connection.release();
                    return;
                });
            } else {
                connection.commit(function (err) {
                    if (err) {
                        console.log(err);
                        connection.rollback(function () {
                            var str = {
                                code: 0,
                                message: err.message
                            };
                            callback(null, str);
                            connection.release();
                            return;
                        });
                    } else {
                        var str = {
                            code: 1,
                            message: "success"
                        };

                        callback(null, str);
                        connection.release();
                        return;
                    }


                });
            }

            // Don't use the connection here, it has been returned to the pool.//返回池当中
        });
    });

}


function deleteB(sql, param, callback) {
    pool.getConnection(function (err, connection) {
        // Use the connection
        connection.query(sql, param, function (err, rows) {
            // And done with the connection.
            if (err) {
                connection.rollback(function () {
                    // throw err;
                    console.log(err);
                    var str = {
                        code: 0,
                        message: err
                    };
                    callback(err, str); //res返回数据
                    connection.release();
                    return;
                });
            }
            connection.commit(function (err) {
                if (err) {
                    console.log(err);
                    connection.rollback(function () {
                        throw err;
                    });
                }
                //result.affectedRows
                var str = {
                    code: 1,
                    message: "success"
                };
                callback(err, str); //res返回数据
                connection.release();
                return;
            });
            // Don't use the connection here, it has been returned to the pool.//返回池当中
        });
    });
}

module.exports = sqlEvent;