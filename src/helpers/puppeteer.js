const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua');

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const advanced_output = config.advanced_output;

class PuppeteerManager {
  constructor() {
    this.browser = null;
  }

  /**
   * @param {string[]} args 
   */
  async launchBrowser(args = []) {
    try {
      puppeteer.use(StealthPlugin());
      puppeteer.use(AnonymizeUAPlugin());
      puppeteer.use(
        RecaptchaPlugin({
          provider: { id: '2captcha', token: '5f31a4f92dcdf0ab0ef0ae07fbf7fb4b' },
          visualFeedback: true
        })
      );
      
      const defaultArgs = [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-features=IsolateOrigins,site-per-process',
        '--ignore-certificate-errors',
        '--allow-insecure-localhost',
        '--disable-background-networking',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--disable-extensions',
      ];

      this.browser = await puppeteer.launch({
        headless: false,
        args: [...defaultArgs, ...args],
      });
    } catch (error) {
      if (advanced_output) console.error('Ошибка при запуске браузера:', error?.message);
    }
  }

  /**
   * @returns {puppeteer.Browser | null} 
   */
  getBrowser() {
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        if (advanced_output) console.error('Ошибка закрытия браузера:', error?.message);
      }
    } else {
      if (advanced_output) console.warn('Нет экземпляра браузера для закрытия');
    }
  }
}

module.exports = PuppeteerManager;