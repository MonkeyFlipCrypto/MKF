#!/usr/bin/env sh

NODE_ENV="development" npm install --silent

if [ -z "$NODE_ENV" ]; then
	export NODE_ENV="development"
fi

if [ -d "/usr/src/common" ]; then
	(cd /usr/src/common; NODE_ENV="development" npm install --silent; npm run prod)
fi

if [ "$NODE_ENV" == "production" ]; then
	npm run prod
	exec npm run start
else
	exec npm run dev
fi
