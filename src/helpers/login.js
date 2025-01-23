async function tryLogin(page, login, password) {
  try {
		await page.type('#user_login', login);
		await page.type('#user_pass', password);
		await page.click('#wp-submit');

		await page.waitForNavigation();

		const currentUrl = page.url();
    const result = await page.evaluate((url) => {
      const loginUrl = url.includes('wp-login.php');
      const passwordInput = document.getElementById('user_pass') !== null;
      const loginDiv = document.getElementById('login') !== null;
      if (loginUrl || (passwordInput && loginDiv)) {
        return 'bad';
      } else {
        return 'good';
      }
    }, currentUrl);
		return result
	} catch (error) {
		console.error('Error in login:', error?.message);
		return 'bad';
	}
}

module.exports = tryLogin;