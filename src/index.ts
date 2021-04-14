import Server from './server'
import winston from './providers/winston'

const server = new Server()

server.start().then(() => {}).catch((err) => {
	winston.error(`Bootstrap error: ${err.stack}`)
	process.exit(1)
})

export default server
