const fs = require('fs');
const readline = require('readline');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const advanced_output = config.advanced_output;

function doesUrlHasPath(url) {
  try {
		const parsedUrl = new URL(url);
		if (parsedUrl.pathname == '/' || !parsedUrl.pathname) {
			return false;
		}
		return true;
	} catch (error) {
		if (advanced_output) console.error('Ошибка анализа URL:', error?.message);
	}
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isWordPressLoginPage(page) {
  try {
    await page.waitForSelector('#user_login', { timeout: 3000 });
		const bodyHtml = await page.content();
	  return bodyHtml.includes('wp-login.php') && await page.$eval('body.wp-core-ui', form => form !== null);
	} catch (error) {
		if (advanced_output) console.error('Ошибка при определение страницы:', error?.message);
	}
}

async function takeScreenshot(page, name) {
  await page.screenshot({
    path: `screenshots/${name}`,
    fullPage: false,
  });
}

const getPrecentage = (part, total) => {
  return ((part / total) * 100).toFixed(1)
}

const countLinesInFile = (filePath) => {
  return new Promise((resolve, reject) => {
    let lineCount = 0;

    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    rl.on('line', () => {
      lineCount += 1;
    });

    rl.on('close', () => {
      resolve(lineCount);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
};

module.exports = { doesUrlHasPath, isWordPressLoginPage, takeScreenshot, getPrecentage, countLinesInFile };