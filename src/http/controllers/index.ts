import Block from '../../database/models/block'
import User from '../../database/models/user'
import Blockchain from '../../blockchain'
import winston from '../../providers/winston'
import { HttpBadRequestError } from '../exceptions'
import { BaseMessage } from '../../message'
import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

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
			try {
				const key = crypto.randomBytes(25).toString('hex')
				const user = await User.create({
					key
				})

				res.json(new BaseMessage({
					key,
					uuid: user.uuid
				}, 'user:register'))
			} catch (err) {
				next(err)
			}
		},
		async unregister(req: Request, res: Response, next: NextFunction) {
			try {
				const user = await User.findOne({
					where: { uuid: req.body.id }
				})

				if (user === null) {
					throw new HttpBadRequestError('User does not exist')
				}

				if (!bcrypt.compareSync(req.body.key, user.key)) {
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
			} catch (err) {
				next(err)
			}
		},
		async mine(req: Request, res: Response, next: NextFunction) {
			try {
				const user = await User.findOne({
					where: { uuid: req.body.id }
				})

				if (user === null) {
					throw new HttpBadRequestError('User does not exist')
				}

				if (!bcrypt.compareSync(req.body.key, user.key)) {
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
				}, 'user:mine'))
			} catch (err) {
				next(err)
			}
		},
		async sell(req: Request, res: Response, next: NextFunction) {
			try {
				const user = await User.findOne({
					where: { uuid: req.body.id }
				})

				if (user === null) {
					throw new HttpBadRequestError('User does not exist')
				}

				if (!bcrypt.compareSync(req.body.key, user.key)) {
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
			} catch (err) {
				next(err)
			}
		},
		async worth(req: Request, res: Response, next: NextFunction) {
			try {
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
			} catch (err) {
				next(err)
			}
		},
		async assets(req: Request, res: Response, next: NextFunction) {
			try {
				const user = await User.findOne({
					where: { uuid: req.body.id }
				})

				if (user === null) {
					throw new HttpBadRequestError('User does not exist')
				}

				if (!bcrypt.compareSync(req.body.key, user.key)) {
					throw new HttpBadRequestError('Invalid key, cannot authenticate')
				}

				const blocks = await Block.findAll({
					where: {
						owner: user.id
					}
				})

				res.json(new BaseMessage(blocks.map(block => block.hash), 'user:assets'))
			} catch (err) {
				next(err)
			}
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

			const firstBlock = await Block.findAll({
				limit: 1,
				where: {},
				order: [['createdAt', 'ASC']]
			})

			res.json(new BaseMessage({
				freeBlocks,
				totalBlocks,
				ownedBlocks,
				firstBlock: {
					index: firstBlock[0].index,
					hash: firstBlock[0].hash,
					timestamp: firstBlock[0].timestamp
				}
			}, 'general:info'))
		}
	}
}
