const puppeteer = require('puppeteer');

class PuppeteerManager {
  constructor() {
    this.browser = null;
  }

  /**
   * Launch the browser with optional arguments
   * @param {string[]} args - Additional arguments for launching the browser
   */
  async launchBrowser(args = []) {
    try {
      const defaultArgs = [
        '--disable-quic',
        '--ignore-certificate-errors',
        '--disable-web-security',
        '--allow-insecure-localhost',
        '--disable-features=IsolateOrigins,site-per-process',
      ];

      this.browser = await puppeteer.launch({
        headless: false,
        args: [...defaultArgs, ...args],
      });
      // console.log('Browser launched successfully');
    } catch (error) {
      console.error('Error launching browser:', error?.message);
    }
  }

  /**
   * Get the currently launched browser instance
   * @returns {puppeteer.Browser | null} The browser instance, or null if not launched
   */
  getBrowser() {
    return this.browser;
  }

  /**
   * Close the browser if it's open
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        // console.log('Browser closed successfully');
      } catch (error) {
        console.error('Error closing browser:', error?.message);
      }
    } else {
      console.warn('No browser instance to close');
    }
  }
}

module.exports = PuppeteerManager;