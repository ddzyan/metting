/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('user_info', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		account: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		password: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		ctime: {
			type: DataTypes.TIME,
			allowNull: false,
			defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
		}
	}, {
		tableName: 'user_info'
	});
};
