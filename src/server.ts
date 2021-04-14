import winston from './providers/winston'
import app from './http/app'
import { defaultConfig } from './config'
import Blockchain from './blockchain'
import waitOn from 'wait-on'

export default class Server {
	async start() {
		const bc = new Blockchain()

		if (defaultConfig.database.connection !== 'sqlite::memory') {
			await waitOn({
				resources: ['tcp:db:3306']
			})
		}

		winston.info('Starting up blockchain')
		await bc.init()

		winston.info('Starting up webserver')
		app(bc).listen(3000, () => {
			winston.info('Webserver is online')
		})
	}
}
