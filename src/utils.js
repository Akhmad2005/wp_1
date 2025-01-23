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

async function takeScreenshot(page, name) {
  await page.screenshot({
    path: `screenshots/${name}`,
    fullPage: false,
  });
}

module.exports = { doesUrlHasPath, isWordPressLoginPage, takeScreenshot };