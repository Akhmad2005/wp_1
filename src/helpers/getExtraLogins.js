const fs = require('fs');
const PuppeteerManager = require('./puppeteer')
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const advanced_output = config.advanced_output;

async function findLoginFromUrl(page, url) {
	try {
		let path = '/?author=1'
		const fullUrl = new URL(path, url).href;
		await page.goto(fullUrl);
		let arr = page.url().split('/');
		if (arr.includes('admin')) {
			for (let i = arr.length - 1; i >= 0; i--) {
				if (arr[i]) return {text: arr[i], from: '/?author=1'};
			}
		} 
		return null;
	} catch (error) {
		if (advanced_output) console.error(`Ошибка при поиске логинов с URL: ${url}`, error?.message);
		return null;
	}
}

async function findLoginFromJSON(page, url) {
	let names = [];
	try {
		let path = '/wp-json/wp/v2/users'
		const fullUrl = new URL(path, url).href;
		const response = await page.goto(fullUrl);
		
		if (!response || response.status() !== 200) {
      if (advanced_output) console.error(`Не удалось получить данные JSON. Статус: ${response?.status()}`);
      return names;
    }

		const contentType = response.headers()['content-type'] || '';
    if (!contentType.includes('application/json')) {
      if (advanced_output) console.error('Ответ не JSON');
      return names;
    }

		const jsonBody = await page.evaluate(() => document.body.innerText);
		JSON.parse(jsonBody).forEach(element => {
			element?.slug && names.push({text: element.slug, from: '/wp-json/wp/v2/users'})
		});
	} catch (error) {
		if (advanced_output) console.error('Ошибка при поиске логинов из /wp-json/wp/v2/users', error?.message);
	}
	return names;
}

const getExtraLogins = async (url) => {
	let puppeteer = new PuppeteerManager()
	let browser;
	let logins = [];
	let page;
	try {
		await puppeteer.launchBrowser();
		browser = puppeteer.getBrowser();
		page = await browser.newPage();
		let login = await findLoginFromUrl(page, url);
		if (login) logins.push(login)

		let loginsFromJson = await findLoginFromJSON(page, url);
		if (loginsFromJson?.length) logins.push(...loginsFromJson)
		} catch (error) {
		if (advanced_output) console.error('Ошибка при поиске логинов:', error?.message);
	} finally {
		await puppeteer.closeBrowser();
		return logins;
	}
}

module.exports =  getExtraLogins;