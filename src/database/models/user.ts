import { Sequelize, Model, DataTypes } from 'sequelize'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const SALT_ROUNDS = 10

export default class User extends Model {
	public id!: number
	public uuid!: string
	public key!: string

	createKey(): string {
		const key = crypto.randomBytes(25).toString('hex')
		this.key = key
		return key
	}

	auth(value: string): boolean {
		const salt = bcrypt.genSaltSync(SALT_ROUNDS)
		const hash = bcrypt.hashSync(value, salt)
		return this.key === hash
	}

	static initializeModel(sequelize: Sequelize): Model {
		return User.init({
			id: {
				type: DataTypes.BIGINT,
				primaryKey: true,
				allowNull: false,
				autoIncrement: true
			},
			uuid: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
				allowNull: false
			},
			key: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: '',
				set(value) {
					const salt = bcrypt.genSaltSync(SALT_ROUNDS)
					const hash = bcrypt.hashSync(value, salt)
					this.setDataValue('key', hash)
				}
			}
		}, {
			sequelize,
			modelName: 'user'
		})
	}
}
