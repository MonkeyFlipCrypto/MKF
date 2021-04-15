import { Sequelize, Model, DataTypes } from 'sequelize'
import Block from './block'

export default class Chain extends Model {
	public diff!: number
	public lastUpdatedBlockIndex!: number

	static initializeModel(sequelize: Sequelize): Model {
		return Chain.init({
			diff: {
				type: DataTypes.BIGINT,
				defaultValue: 4,
				allowNull: false
			},
			lastUpdatedBlockIndex: {
				type: DataTypes.BIGINT,
				allowNull: true
			}
		}, {
			sequelize,
			modelName: 'chain'
		})
	}
}
