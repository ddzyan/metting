/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('room_info', {
		id: {
			type: DataTypes.BIGINT,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		roomId: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		roomName: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		createUserId: {
			type: DataTypes.BIGINT,
			allowNull: false
		},
		roomType: {
			type: DataTypes.STRING(10),
			allowNull: false
		},
		record: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		filePath: {
			type: DataTypes.STRING(255),
			allowNull: true
		},
		issueTime: {
			type: DataTypes.TIME,
			allowNull: false,
			defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
		}
	}, {
		tableName: 'room_info',
		timestamps: false
	});
};
