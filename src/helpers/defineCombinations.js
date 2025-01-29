const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const {doesUrlHasPath} = require('./utils') 
const getExtraLogins = require('./getExtraLogins') 

const protocol = config.protocol;
const urlWithCredentialsRegex = /^http.*:\/\/.*;.*;.*/;
const emailWithPasswordRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+:.+$/;

const modifyUrlLine = async (line, passwords) => {
	const [url, login] = line.split(';');
	let results = []
	let extraLogins = await getExtraLogins(url) || []
	if (doesUrlHasPath(url)) {
		results.push({url, logins: [{text: login, from: 'default'}, ...extraLogins], passwords})
		results.push({url: new URL('/wp-login.php', new URL(url).origin).href, logins: [{text: login, from: 'default'}, ...extraLogins], passwords});
	} else {
		results.push({url: new URL('/wp-login.php', url).href, logins: [{text: login, from: 'default'}, ...extraLogins], passwords})
	}
	return results;
}

const modifyEmailLine = async (line, passwords) => {
	let results = [];
	const [email] = line.split(':');
	if (email) {
		let [name, domain] = email?.split('@');
		if (domain.includes('https://') || domain.includes('http://')) {
			let url = domain;
			let extraLogins = await getExtraLogins(url) || []
			results.push({url: new URL('/wp-login.php', url).href, logins: [{text: name, from: 'default'}, {text: domain, from: 'default'}, {text: email, from: 'default'}, ...extraLogins], passwords})
		} else {
			if (protocol == 'any') {
				let url = 'https://' + domain;
				let url2 = 'http://' + domain;
				let extraLogins = await getExtraLogins(url) || []
				let extraLogins2 = await getExtraLogins(url2) || []
				results.push({url: new URL('/wp-login.php', url).href, logins: [{text: name, from: 'default'}, {text: domain, from: 'default'}, {text: email, from: 'default'}, ...extraLogins], passwords})
				results.push({url: new URL('/wp-login.php', url2).href, logins: [{text: name, from: 'default'}, {text: domain, from: 'default'}, {text: email, from: 'default'}, ...extraLogins2], passwords})
			} else {
				let url = `${protocol}://` + domain;
				let extraLogins = await getExtraLogins(url) || []
				results.push({url: new URL('/wp-login.php', url).href, logins: [{text: name, from: 'default'}, {text: domain, from: 'default'}, {text: email, from: 'default'}, ...extraLogins], passwords})
			}
		}
	}
	return results;
}

const defineCombinations = async (inputLines) => {
	let output = [];
	for (let i = 0; i < inputLines.length; i++) {
		let {line, passwords} = inputLines[i];
		if (urlWithCredentialsRegex.test(line)) {
			let [...res] = await modifyUrlLine(line, passwords)
			output.push({line, combinations: res})
		} else if (emailWithPasswordRegex.test(line)) {
			let [...res] = await modifyEmailLine(line, passwords)
			output.push({line, combinations: res})
		}
	}
	return output
}

module.exports = defineCombinations;