import {readFileSync} from 'node:fs';

const {engines} = JSON.parse(readFileSync('./package.json'));

const node = engines.node
	.split(/[^\d.]+/)
	.filter(s => s.length)
	.map(s => [...s.split('.').map(s => +s || 0), 0, 0].slice(0, 3))
	.sort((a, b) => a[2] - b[2])
	.sort((a, b) => a[1] - b[1])
	.sort((a, b) => a[0] - b[0])[0]
	.join('.');

export default api => {
	const env = api.env();
	api.cache(() => env);
	const modules = env === 'esm' ? false : 'commonjs';
	const ext = modules === 'commonjs' ? '.cjs' : '.js';
	const presets = [];
	const plugins = [];
	presets.push(
		[
			'@babel/preset-env',
			{
				modules,
				exclude: ['proposal-dynamic-import'],
				targets: {
					node
				}
			}
		],
		[
			'@babel/preset-typescript',
			{
				allowDeclareFields: true
			}
		]
	);
	plugins.push([
		'module-replace',
		{
			replace: [[/^(\.\.?\/.+)\.(m|c)?tsx?$/i, `$1${ext}`]]
		}
	]);
	if (modules === 'commonjs') {
		plugins.push([
			'@babel/plugin-transform-modules-commonjs',
			{
				importInterop: 'node'
			}
		]);
	}
	return {
		presets,
		plugins
	};
};
