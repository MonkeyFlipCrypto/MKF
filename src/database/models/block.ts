import { SHA256 } from 'crypto-js'
import { Sequelize, Model, DataTypes } from 'sequelize'

export default class Block extends Model {
	public index!: number
	public timestamp!: Date
	public data!: string
	public nonce!: number
	public preceedingHash!: string
	public hash!: string
	public ownerID!: string

	computeHash() {
		return SHA256(this.index + this.preceedingHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString()
	}

	proofOfWork(diff: number) {
		while (this.hash.substring(0, diff) !== Array(diff + 1).join('0')) {
			this.nonce++
			this.hash = this.computeHash()
		}
	}

	static initializeModel(sequelize: Sequelize): Model {
		return Block.init({
			index: {
				type: DataTypes.BIGINT,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true
			},
			timestamp: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false
			},
			data: {
				type: DataTypes.STRING,
				allowNull: false
			},
			nonce: {
				type: DataTypes.BIGINT,
				allowNull: false
			},
			preceedingHash: {
				type: DataTypes.STRING,
				allowNull: false
			},
			hash: {
				type: DataTypes.STRING,
				allowNull: false
			},
			ownerID: {
				type: DataTypes.UUID,
				allowNull: true
			}
		}, {
			sequelize,
			modelName: 'block'
		})
	}
}