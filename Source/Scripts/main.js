//const { createRequire } = require('module');

export function activate() {
	console.log('activating...');
	console.log(nova.workspace.path);

	nova.commands.register('apexskier.webpack.run', editor => {
		const process = new Process('/usr/bin/env', {
			args: ['node', '--inspect-brk', `${nova.extension.path}/Scripts/process.dist.js`],
			env: {
				NODE_PATH: `${nova.workspace.path}/node_modules`,
				WEBPACK_CONFIG: `${nova.workspace.path}/webpack.dev.js`,
			},
			cwd: nova.workspace.path,
			stdio: 'jsonrpc',
		});

		process.start();

		process.onNotify('ack', message => {
			console.log('The server successfully connected.', message);
			clearInterval(synterval);
		});

		console.log('starting sub-process', process.pid);

		const synterval = setInterval(() => {
			console.log('attempting to connect to sub-process');
			debugger;
			process.notify('syn', { hello: 'world' });
		}, 400);
	});
}
