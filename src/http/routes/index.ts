import { Router } from 'express'
import { validateBody, validateQuery } from '../middleware/validate'
import genController from '../controllers/index'
import Blockchain from '../../blockchain'

const schema_id = {
	id: '/id',
	type: 'string',
	required: true,
	pattern: /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/
}

const schema_auth = {
	id: '/authenticate',
	type: 'object',
	properties: {
		id: schema_id,
		key: { type: 'string', required: true }
	}
}

const schema_hash = {
	id: '/hash',
	type: 'string',
	maxLength: 64,
	minLength: 64,
	required: true
}

const schema_mine = {
	id: '/Mine',
	type: 'object',
	properties: {
		...schema_auth.properties,
		hash: schema_hash
	}
}

const schema_worth = {
	id: '/Worth',
	type: 'object',
	properties: {
		id: schema_id
	}
}

const schema_give = {
	id: '/Give',
	type: 'object',
	properties: {
		...schema_auth.properties,
		hash: schema_hash,
		to: schema_id
	}
}

export default function(bc: Blockchain): Router {
	const router = Router()
	const controller = genController(bc)

	router.post('/register',
		controller.register)

	router.post('/unregister',
		controller.unregister)

	router.post('/mine',
		validateBody(schema_mine),
		controller.mine)

	router.post('/sell',
		validateBody(schema_mine),
		controller.sell)

	router.get('/worth',
		validateQuery(schema_worth),
		controller.worth)

	router.get('/list',
		controller.list)

	router.get('/info',
		controller.info)

	return router
}
