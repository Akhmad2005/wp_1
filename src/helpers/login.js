const fs = require('fs');
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const advanced_output = config.advanced_output;

const checkHomePageForProfile = async (page) => {
  const currentUrl = await page.url();
  const baseUrl = new URL(currentUrl).origin;
  await page.goto(baseUrl, { waitUntil: 'networkidle2'});
  const profileExists = await page.$('#wp-admin-bar-my-account');
  if (profileExists) {
    return true
  } else {
    return false
  }
}

const checkForMathCaptcha = async (page, queue = 'before') => {
  try {
    let mathQuestion = await page.evaluate(() => {
      const element = document.querySelector('label[for="jetpack_protect_answer"]');
      return element ? element.textContent : null;
    });
    if (mathQuestion) {
      const match = mathQuestion.match(/(\d+)\s*([+\-*/])\s*(\d+)/);
      if (match) {
        const num1 = parseInt(match[1], 10);
        const operator = match[2];
        const num2 = parseInt(match[3], 10);
        let answer;
        switch (operator) {
          case '+': answer = num1 + num2; break;
          case '-': answer = num1 - num2; break;
          case '*': answer = num1 * num2; break;
          case '/': answer = num1 / num2; break;
          default: throw new Error(`Неизвестный оператор: ${operator}`);
        }
        await page.type('#jetpack_protect_answer', answer + '');
        if (queue == 'after') {
          await page.click('input[type="submit"]');
          await page.waitForNavigation();
        }
        return true;
      } else {
        if (advanced_output) console.error(`Не удалось проанализировать математический вопрос: "${mathQuestion.trim()}"`);
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    if (advanced_output) console.error('Ошибка при обработке математической капчи:', error.message);
    return false;
  }
};

async function tryLogin(page, login, password, attemptsCount = 1) {
  let result = 'bad';
  try {
    await checkForMathCaptcha(page)
		await page.type('#user_login', login);
		await page.type('#user_pass', password);
		await page.click('#wp-submit');

		await page.waitForNavigation();

    if (attemptsCount == 1 && await checkForMathCaptcha(page, 'after')) {
      result = tryLogin(page, login, password, attemptsCount++)
    }
    let cookies = await page.cookies();
    const cookieNameRegex = /^wordpress_logged_in_/;
    const matchingCookie = cookies.find(cookie => cookieNameRegex.test(cookie.name));
    if (matchingCookie) {
      result = 'good';
    } else {
      const currentUrl = await page.url();
      if (currentUrl.includes('wp-login.php')) {
        let check = await checkHomePageForProfile(page)
        if (check) {
          result = 'good'
        } 
      }
    }
		return result
	} catch (error) {
		if (advanced_output) console.error('Ошибка при попытке авторизации:', error?.message);
		return 'bad';
	}
}

module.exports = tryLogin;