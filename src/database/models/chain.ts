import { Sequelize, Model, DataTypes } from 'sequelize'
import Block from './block'

export default class Chain extends Model {
	public diff!: number

	static initializeModel(sequelize: Sequelize): Model {
		return Chain.init({
			diff: {
				type: DataTypes.BIGINT,
				defaultValue: 4,
				allowNull: false
			}
		}, {
			sequelize,
			modelName: 'chain'
		})
	}
}
