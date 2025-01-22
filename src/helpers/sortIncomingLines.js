const urlWithCredentialsRegex = /^http.*:\/\/.*;.*;.*/;
const emailWithPasswordRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+:.+$/;
const {doesUrlHasPath} = require('../utils') 
const getExtraLogins = require('./getExtraLogins') 


const modifyUrlLine = async (line) => {
	const [url, login, password] = line.split(';');
	let results = []
	let extraLogins = await getExtraLogins(url) || []
	if (doesUrlHasPath(url)) {
		results.push({url, logins: [{text: login, from: 'default'}, ...extraLogins], password})
		results.push({url: new URL('/wp-login.php', new URL(url).origin).href, logins: [{text: login, from: 'default'}, ...extraLogins], password});
	} else {
		results.push({url: new URL('/wp-login.php', url).href, logins: [{text: login, from: 'default'}, ...extraLogins], password})
	}
	return results;
}

const modifyEmailLine = async (line) => {
	let results = [];
	const [email, password] = line.split(':');
	if (email) {
		let [name, domain] = email?.split('@');
		if (domain.includes('https://') || domain.includes('http://')) {
			let url = domain;
			let extraLogins = await getExtraLogins(url) || []
			results.push({url: new URL('/wp-login.php', url).href, logins: [{text: name, from: 'default'}, {text: domain, from: 'default'}, {text: email, from: 'default'}, ...extraLogins], password})
		} else {
			let url = 'https://' + domain;
			let url2 = 'http://' + domain;
			let extraLogins = await getExtraLogins(url) || []
			let extraLogins2 = await getExtraLogins(url2) || []
			results.push({url: new URL('/wp-login.php', url).href, logins: [{text: name, from: 'default'}, {text: domain, from: 'default'}, {text: email, from: 'default'}, ...extraLogins], password})
			results.push({url: new URL('/wp-login.php', url2).href, logins: [{text: name, from: 'default'}, {text: domain, from: 'default'}, {text: email, from: 'default'}, ...extraLogins2], password})
		}
	}
	return results;
}

const sortIncomingLines = async (lines) => {
	let cases = [];
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		if (urlWithCredentialsRegex.test(line)) {
			let res = await modifyUrlLine(line)
			cases.push(...res)
		} else if (emailWithPasswordRegex.test(lines[i])) {
			let res = await modifyEmailLine(line)
			cases.push(...res)
		}
	}
	return cases
}

module.exports = sortIncomingLines;