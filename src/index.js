const fs = require('fs');
const { handleLogin } = require('./login');
const sortIncomingLines = require('./helpers/sortIncomingLines')
const combineCases = require('./helpers/combineCases')
const {writeToFile} = require('./helpers/outputSaver')

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const lines = fs.readFileSync(config.input_file, 'utf-8').split('\n').map(l => l.trim());
const threadCount = config.thread_count

async function main() {
	try {
		let cases = await sortIncomingLines(lines)
		const combinedCases = await combineCases(cases);
		const jsonOutput = JSON.stringify(combinedCases, null, 2);
		fs.writeFile('output_newest.json', jsonOutput, 'utf8', (err) => {
			if (err) {
				console.error('Error writing file:', err);
			} else {
				console.log('File written successfully');
			}
		});
		for (const [index, element] of cases.entries()) {
			const { url, logins, password } = element;
			try {
				await handleLogin(url, logins?.map(l => l?.text), password, index);
			} catch (error) {
				console.error(`Error in handleLogin for ${url}:`, error.message);
			}
		}
	} catch (error) {
		console.error('Error:', error?.message);
	} finally {
		writeToFile();
	}
}

main();