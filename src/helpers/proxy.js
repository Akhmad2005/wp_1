const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const advanced_output = config.advanced_output;

const getProxyParts = (proxy) => {
	if (!proxy) return null;
	const parts = proxy.split(':');
	if (parts.length !== 4) {
		if (advanced_output) console.error(`Неверный формат прокси: ${proxy}`);
		return null;
	}

	const [ip, port, username, password] = parts;

	return ({ip, port, username, password});
};

module.exports = {getProxyParts};