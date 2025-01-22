const puppeteer = require('puppeteer');

let browser = null;

async function launchBrowser() {
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-quic', 
        '--ignore-certificate-errors',
        '--disable-web-security',
        '--allow-insecure-localhost',
        '--disable-features=IsolateOrigins,site-per-process',
      ]
    });
  } catch (error) {
    console.error('Error launching browser', error?.message);
  }
}

function getBrowser() {
  return browser;
}

module.exports = { launchBrowser, getBrowser };