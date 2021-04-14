import { Request, Response, NextFunction } from 'express'
import { HttpError, HttpNotFoundError } from '../exceptions'
import { ValidationError } from 'sequelize'

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
	next(new HttpNotFoundError())
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
	const response: Record<string, any> = {
		status: 500,
		detail: 'Internal server error'
	}

	if (err instanceof ValidationError) {
		Object.assign(response, {
			status: 500,
			detail: 'Validation error',
			errors: err.errors.map((e) => ({
				message: e.message,
				value: e.value,
				type: e.type
			}))
		})
	} else if (err instanceof HttpError) {
		Object.assign(response, err.toJSON())
	} else {
		response['error_message'] = err.message.toString()
		response['error_type'] = err.name.toLowerCase()
	}

	if (process.env.NODE_ENV !== 'production' && err.stack) {
		response['stack'] = err.stack.toString()
	}

	res.status(response.status).json(response)
}
