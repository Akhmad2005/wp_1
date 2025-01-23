const getProxyParts = (proxy) => {
	if (!proxy) return null;
	const parts = proxy.split(':');
	if (parts.length !== 4) {
			console.error('Invalid proxy format');
			return null;
	}

	const [ip, port, username, password] = parts;

	return ({ip, port, username, password});
};

module.exports = {getProxyParts};