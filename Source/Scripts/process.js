console.log(__filename);
console.log(process.env);

console.log(process.argv);

import Webpack from 'webpack';

const net = require('net');
const jayson = require('jayson');

const webpackConfig = require(process.env.WEBPACK_CONFIG);

const compiler = Webpack(webpackConfig);

const server = jayson.server({
	syn: function(args, callback) {
		console.log('syn', args);
		callback(null, 'ack');
	},
});

server.http().listen(8546);

compiler.watch({}, function(err, stats) {
	if (err) {
		console.log({ error: err });
	}
	const jsonStats = stats.toJson();
	if (jsonStats.errors.length > 0) {
		for (let error of jsonStats.errors) {
			console.error(error);
		}
	}
	if (jsonStats.warnings.length > 0) {
		for (let warning of jsonStats.warnings) {
			console.warn(warning);
		}
	}
});
