'use strict'

class AbstractDao {
    constructor(model) {
        this.model = model;
    }

    /**
     * 获取计数
     * @param obj 条件
     * @param cb 回调函数
     */
    count(obj, cb) {
        this.model.count({
            where: obj,
            logging: false
        }).then(function (count) {
            cb(count);
        });
    }

    /**
     * 获取单个记录
     * @param id 记录的主键
     * @param cb 回调函数
     */
    load(id, cb) {
        this.model.findById(id).then(function (result) {
            cb(result.dataValues);
        });
    }

    /**
     * 删除（批量或单个）
     * @param ids id数组或者单个id
     * @param cb 回调函数
     */
    del(obj, cb) {
        this.model.destroy({
            where: obj,
            logging: false
        }).then(function (count) {
            //count为已经删除的行数
            cb(count);
        });
    }

    /**
     * 获取所有数据
     * @param cb 回调函数
     */
    all(obj, cb) {
        this.model.findAll({
            where: obj,
            raw: true,
            logging: false
        }).then(function (result) {
            var re = {
                count: result.length,
                rows: result
            };
            cb(re);
        });
    }
    /**
     * 条件查询
     * @param obj 查询条件
     * @param start 开始记录
     * @param limit 分页大小
     * @param cb 回调函数
     */
    search(obj, start, limit, cb) {
        this.model.findAndCountAll({
            where: obj,
            limit: limit,
            offset: start,
            logging: false
        }).then(function (result) {
            var re = {
                count: result.count,
                rows: []
            };
            for (let i = 0; i < result.rows.length; i++) {
                re.rows.push(result.rows[i].dataValues);
            }
            cb(re);
        });
    }

    /**
     * 查询
     * @param start 开始记录
     * @param limit 分页大小
     * @param cb 回调函数
     */
    list(start, limit, cb) {
        this.search(null, start, limit, cb);
    }

    /**
     * 创建新的记录
     * @param obj 新的记录
     * @param cb 回调函数
     */
    create(obj, cb) {
        this.model.create(obj).then(function (result) {
            cb(result.dataValues);
        });
    }

    /**
     * 批量创建新的记录
     * @param objs 新记录数组
     * @param cb 回调函数
     */
    multiCreate(objs, cb) {
        this.model.bulkCreate(objs).then(function (result) {
            var array = [];
            for (let i = 0; i < result.length; i++) {
                array.push(result[i].dataValues);
            }
            cb(array);
        });
    }

    /**
     * 更新记录
     * @param obj1 更新条件
     * @param obj2 待更新的记录
     * @param cb 回调函数
     */
    update(obj1, obj2, cb) {
        this.model.update(obj2, {
            where: obj1
        }).then(function (result) {
            cb(result);
        });
    }

    /**
     * 根据条件查询，然后排序
     * @param obj1 查询条件
     * @param obj2 排序条件
     * @param cb 回调函数
     */
    allDesc(obj1, obj2, cb) {
        this.model.findAll({
            where: obj,
            desc: obj2,
            logging: true,
            raw: true
        }).then(function (result) {
            var re = {
                count: result.length,
                rows: result
            };
            cb(re);
        });
    }

}

module.exports = AbstractDao;