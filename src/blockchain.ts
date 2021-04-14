import Block from './database/models/block'
import Chain from './database/models/chain'

import { Sequelize, Options as SequelizeOptions } from 'sequelize'

interface BlockchainConfig {
	database?: {
		connection?: string
		options?: SequelizeOptions
	}
}

const env = process.env.NODE_ENV || 'development'
const defaultConfig: BlockchainConfig = {
	database: {
		connection: env === 'test' ? 'sqlite::memory' : `mariadb://possum:${process.env.DB_PASSWORD || "possum"}@db/possumcoin`,
		options: {
			logging: env !== 'test'
		}
	}
}

const models = {
	Block,
	Chain
}

export default class Blockchain {
	private chain: Chain
	private db: Sequelize

	constructor(config: BlockchainConfig = defaultConfig) {
		this.db = new Sequelize(config.database.connection, config.database.options)

		Object.values(models)
			.forEach(model => model.initializeModel(this.db))
	}

	async init(): Promise<void> {
		await this.db.authenticate()
		await this.db.sync({ force: false })

		this.chain = await Chain.findOrCreate({ where: {} })[0]
		const count = await Block.count()

		if (count === 0) {
			// Create our genesis block
			await Block.create({
				data: 'Initial block in chain',
				preceedingHash: '0'
			})
		}
	}

	async obtainLatestBlock(): Promise<Block> {
		return await Block.findAll({
			limit: 1,
			where: {},
			order: [['createdAt', 'DESC']]
		})[0]
	}

	async addBlock(): Promise<Block> {
		const latestBlock = await this.obtainLatestBlock()
		const count = await Block.count()

		const block = await Block.create({
			data: this.chain.diff.toString(),
			preceedingHash: latestBlock.hash
		})

		block.proofOfWork(this.chain.diff)
		this.chain.diff += block.timestamp.getTime() - latestBlock.timestamp.getTime()

		await block.save()
		return block
	}

	async checkChainValidity(): Promise<Boolean> {
		const blockchain = await Block.findAll()
		for (let i = 1; i < blockchain.length; i++) {
			const curr = blockchain[i]
			const prec = blockchain[i - 1]

			if (curr.hash !== curr.computeHash()) {
				return false
			}

			if (curr.preceedingHash !== prec.hash) {
				return false
			}
		}
		return true
	}
}
