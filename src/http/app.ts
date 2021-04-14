import winston from '../providers/winston'
import Blockchain from '../blockchain'
import genIndexRoute from './routes/index'
import { notFoundHandler, errorHandler } from './middleware/error'
import express from 'express'

export default function(bc: Blockchain): express {
	const app = express()

	app.use((req, res, next) => {
		winston.debug(`receving request from ${req.protocol}://${req.hostname}${req.originalUrl} (${req.method})`)
		next()
	})

	app.use(express.urlencoded({ extended: false }))
	app.use(express.json())

	app.use('/', genIndexRoute(bc))

	app.use(notFoundHandler)
	app.use(errorHandler)

	return app
}
