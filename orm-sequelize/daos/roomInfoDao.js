'use strict'

const models = require('../models');
const AbstractDao = require('./AbstractDao');

class roomInfoDao extends AbstractDao {
    constructor() {
        super(models.room_info);
    }

}
module.exports = roomInfoDao;