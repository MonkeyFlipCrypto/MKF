import Block from '../../database/models/block'
import User from '../../database/models/user'
import Blockchain from '../../blockchain'
import winston from '../../providers/winston'
import { HttpBadRequestError } from '../exceptions'
import { BaseMessage } from '../../message'
import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'

const genGetWorth = (bc: Blockchain) => async (id: number) => {
	return await Block.count({
		where: {
			owner: id
		}
	})
}

export default function(bc: Blockchain) {
	const getWorth = genGetWorth(bc)

	return {
		async register(req: Request, res: Response, next: NextFunction) {
			const user = await User.create({})
			const key = user.createKey()

			await user.save()

			res.json(new BaseMessage({
				key,
				uuid: user.uuid
			}, 'user:register'))
		},
		async unregister(req: Request, res: Response, next: NextFunction) {
			const user = await User.findOne({
				where: { uuid: req.body.id }
			})

			if (user === null) {
				throw new HttpBadRequestError('User does not exist')
			}

			if (!bcrypt.compareSync(user.key, req.body.key)) {
				throw new HttpBadRequestError('Invalid key, cannot authenticate')
			}

			const blocks = await Block.findAll({
				where: {
					owner: user.id
				}
			})

			for (const block of blocks) {
				block.owner = null
				await block.save()
			}

			await user.destroy()

			res.json(new BaseMessage({
				endWorth: blocks.length
			}, 'user:unregister'))
		},
		async mine(req: Request, res: Response, next: NextFunction) {
			const user = await User.findOne({
				where: { uuid: req.body.id }
			})

			if (user === null) {
				throw new HttpBadRequestError('User does not exist')
			}

			if (!user.auth(req.body.key)) {
				throw new HttpBadRequestError('Invalid key, cannot authenticate')
			}

			const block = await Block.findOne({
				where: {
					hash: req.body.hash,
					owner: null
				}
			})

			if (block === null) {
				throw new HttpBadRequestError('Invalid hash, either it doesn\'t exist or someone already owns it')
			}

			block.owner = user.id
			await block.save()

			setTimeout(() => {
				bc.addBlock().then(() => winston.info('Generated a new block'))
					.catch(error => winston.error(`Failed to generate a new block: ${error}`))
			}, 3000)

			res.json(new BaseMessage({
				worth: await getWorth(user.id)
			}, 'user:sell'))
		},
		async sell(req: Request, res: Response, next: NextFunction) {
			const user = await User.findOne({
				where: { uuid: req.body.id }
			})

			if (user === null) {
				throw new HttpBadRequestError('User does not exist')
			}

			if (!bcrypt.compareSync(user.key, req.body.key)) {
				throw new HttpBadRequestError('Invalid key, cannot authenticate')
			}

			const block = await Block.findOne({
				where: {
					hash: req.body.hash,
					owner: user.id
				}
			})

			if (block === null) {
				throw new HttpBadRequestError('Invalid hash, either it doesn\'t exist or user does not own it')
			}

			block.owner = null
			await block.save()

			res.json(new BaseMessage({
				worth: await getWorth(user.id)
			}, 'user:sell'))
		},
		async worth(req: Request, res: Response, next: NextFunction) {
			const user = await User.findOne({
				where: { uuid: req.query.id }
			})

			if (user === null) {
				throw new HttpBadRequestError('User does not exist')
			}

			res.json(new BaseMessage({
				uuid: user.uuid,
				worth: await getWorth(user.id)
			}, 'user:worth'))
		},
		async assets(req: Request, res: Response, next: NextFunction) {
			const user = await User.findOne({
				where: { uuid: req.body.id }
			})

			if (user === null) {
				throw new HttpBadRequestError('User does not exist')
			}

			if (!bcrypt.compareSync(user.key, req.body.key)) {
				throw new HttpBadRequestError('Invalid key, cannot authenticate')
			}

			const blocks = await Block.findAll({
				where: {
					owner: user.id
				}
			})

			res.json(new BaseMessage(blocks.map(block => block.hash), 'user:assets'))
		},
		async list(req: Request, res: Response, next: NextFunction) {
			const users = await User.findAll({})
			const worths = await Promise.all(users.map(user => getWorth(user.id)))

			res.json(new BaseMessage(users.map((user, index) => ({
				uuid: user.uuid,
				worth: worths[index]
			})), 'user:list'))
		},
		async info(req: Request, res: Response, next: NextFunction) {
			const freeBlocks = await Block.count({
				where: {
					owner: null
				}
			})

			const totalBlocks = await Block.count()
			const ownedBlocks = totalBlocks - freeBlocks

			const firstHash = await Block.findAll({
				limit: 1,
				where: {},
				order: [['createdAt'. 'ASC']]
			})[0].hash

			res.json(new BaseMessage({
				freeBlocks,
				totalBlocks,
				ownedBlocks,
				firstHash
			}, 'general:info'))
		}
	}
}
