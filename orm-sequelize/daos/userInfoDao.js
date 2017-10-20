'use strict'

const models = require('../models');
const AbstractDao = require('./AbstractDao');

class userInfoDao extends AbstractDao {
    constructor() {
        super(models.user_info);
    }

}
module.exports = userInfoDao;