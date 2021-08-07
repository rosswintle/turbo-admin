#!/bin/sh
node_modules/.bin/esbuild src/main.js --bundle --sourcemap --outfile=dist/main.min.js
#node_modules/.bin/esbuild src/main.js --bundle --minify --sourcemap --outfile=dist/main.min.js
