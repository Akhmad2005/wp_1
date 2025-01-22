const {getBrowser} = require('./puppeteer')

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
		console.error('Error in login from url', error?.message);
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
      console.error(`Failed to fetch JSON data. Status: ${response?.status()}`);
      return names;
    }

		const contentType = response.headers()['content-type'] || '';
    if (!contentType.includes('application/json')) {
      console.error('Response is not JSON');
      return names;
    }

		const jsonBody = await page.evaluate(() => document.body.innerText);
		JSON.parse(jsonBody).forEach(element => {
			element?.slug && names.push({text: element.slug, from: '/wp-json/wp/v2/users'})
		});
	} catch (error) {
		console.error('Error in login from json', error?.message);
	}
	return names;
}

const getExtraLogins = async (url) => {
	let logins = [];
	let page;
	try {
		let browser = getBrowser();
		page = await browser.newPage();
		let login = await findLoginFromUrl(page, url);
		if (login) logins.push(login)

		let loginsFromJson = await findLoginFromJSON(page, url);
		if (loginsFromJson?.length) logins.push(...loginsFromJson)
		} catch (error) {
		console.error('Error while getting login:', error?.message);
	} finally {
		page?.close();
		return logins;
	}
}

module.exports =  getExtraLogins;