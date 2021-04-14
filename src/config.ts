import { Options as SequelizeOptions } from 'sequelize'

export interface BlockchainConfig {
	production?: Boolean
	env?: string
	database?: {
		connection?: string
		options?: SequelizeOptions
	}
	winston?: {
		level?: string
	}
}

const env = process.env.NODE_ENV || 'development'
const production = env === 'production'

const logLevels: Record<string, string> = {
	test: 'error',
	development: 'debug',
	production: 'info'
}

export const defaultConfig: BlockchainConfig = {
	production,
	env,
	database: {
		connection: env === 'test' ? 'sqlite::memory' : `mariadb://monkey:${process.env.DB_PASSWORD}@db/flip`,
		options: {
			logging: env !== 'test'
		}
	},
	winston: {
		level: logLevels[env]
	}
}
