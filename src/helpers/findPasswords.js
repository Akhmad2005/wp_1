const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const advanced_output = config.advanced_output;

const urlWithCredentialsRegex = /^http.*:\/\/.*;.*;.*/;
const emailWithPasswordRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+:.+$/;

function extractDomainAndPassword(line) {
 try {
  let output = {};
  if (urlWithCredentialsRegex.test(line)) {
    const [url, login, password] = line.split(';');
    let domain = new URL(url).hostname;
    domain = domain.startsWith("www.") ? domain.slice(4) : domain;
    output = {domain, password};
  } else if (emailWithPasswordRegex.test(line)) {
    const [email, password] = line.split(':');
    let [name, domain] = email?.split('@');
    output = {domain: domain.startsWith("www.") ? domain.slice(4) : domain, password}
  }
  return output;
 } catch (error) {
  if (advanced_output) console.log('Ошибка', error?.message);
 }
}

const findPasswords = (lines) => {
  let linesPasswords = {};
  lines.forEach(line => {
    let {domain, password} = extractDomainAndPassword(line);
    if (!linesPasswords[domain]) {
      linesPasswords[domain] = new Set([password]);
    } else {
      linesPasswords[domain].add(password);
    }
  });  
  Object.keys(linesPasswords).forEach(domain => {
    linesPasswords[domain] = Array.from(linesPasswords[domain]);
  });
  return lines.map(line => {
    const { domain } = extractDomainAndPassword(line);
    const passwords = linesPasswords[domain] || [];
    return {
      line: line,
      passwords: passwords
    };
  })
};

module.exports = findPasswords;