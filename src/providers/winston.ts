import winston from 'winston'
import { defaultConfig } from '../config'

const logger = winston.createLogger({
	level: defaultConfig.winston.level,
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.splat(),
		winston.format.simple()
	),
	transports: [ new winston.transports.Console() ]
})


export default logger
