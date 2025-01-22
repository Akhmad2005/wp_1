const fs = require('fs');
const { handleLogin } = require('./login');
const sortIncomingLines = require('./helpers/sortIncomingLines')
const {launchBrowser} = require('./helpers/puppeteer')
const {writeToFile} = require('./helpers/outputSaver')

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const lines = fs.readFileSync(config.input_file, 'utf-8').split('\n').map(l => l.trim());

async function main() {
	try {
		await launchBrowser();
		
		let cases = await sortIncomingLines(lines)
		for (const element of cases) {
			const { url, logins, password } = element;
			try {
				await handleLogin(url, logins?.map(l => l?.text), password);
			} catch (error) {
				console.error(`Error in handleLogin for ${url}:`, error.message);
			}
		}
		const jsonOutput = JSON.stringify(cases, null, 2);
		fs.writeFile('output.json', jsonOutput, 'utf8', (err) => {
			if (err) {
				console.error('Error writing file:', err);
			} else {
				console.log('File written successfully');
			}
		});
		writeToFile();
	} catch (error) {
		console.error('Error:', error?.message);
	}
}

main();