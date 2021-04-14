import Block from './database/models/block'
import Chain from './database/models/chain'
import User from './database/models/user'
import { defaultConfig, BlockchainConfig } from './config'

import { Sequelize } from 'sequelize'

const models = {
	Block,
	Chain,
	User
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

		if ((await Chain.count()) == 0) {
			this.chain = await Chain.create({})
		} else {
			this.chain = await Chain.findOne({
				where: {}
			})
		}
		const count = await Block.count()

		if (count === 0) {
			// Create our genesis block
			const block = await Block.create({
				index: 0,
				data: 'Initial block in chain',
				preceedingHash: '0'
			})

			block.hash = block.computeHash()
			await block.save()
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
			index: count,
			data: this.chain.diff.toString(),
			preceedingHash: latestBlock.hash
		})

		block.hash = block.computeHash()
		block.proofOfWork(this.chain.diff)
		this.chain.diff = (this.chain.diff + (block.timestamp.getTime() - latestBlock.timestamp.getTime())) % 63

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
