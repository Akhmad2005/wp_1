function doesUrlHasPath(url) {
  try {
		const parsedUrl = new URL(url);
		if (parsedUrl.pathname == '/' || !parsedUrl.pathname) {
			return false;
		}
		return true;
	} catch (error) {
		console.error('Error parsing URL:', error?.message);
	}
}

async function isWordPressLoginPage(page) {
  try {
		const bodyHtml = await page.content();
	  return bodyHtml.includes('wp-login.php') && await page.$eval('body.wp-core-ui', form => form !== null);
	} catch (error) {
		console.error('Error defining page:', error?.message);
	}
}

async function tryLogin(page, login, password) {
  try {
		await page.type('#user_login', login);
		await page.type('#user_pass', password);
		await page.click('#wp-submit');

		await page.waitForNavigation();

		const result = await page.evaluate(() => {
			const loginUrl = page.url().includes('wp-login.php');
      const passwordInput = document.getElementById('user_pass') !== null;
      const loginDiv = document.getElementById('login') !== null;
      if (loginUrl || passwordInput && loginDiv)  {
				return 'bad';
			} else {
				return 'good';
			}
    });
		return result
	} catch (error) {
		console.error('Error in login:', error?.message);
		return 'bad';
	}
}

async function takeScreenshot(page, name) {
  await page.screenshot({
    path: `screenshots/${name}`,
    fullPage: false,
  });
}

module.exports = { doesUrlHasPath, isWordPressLoginPage, tryLogin, takeScreenshot };