const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const filePath = config.goods_file_path; 
const advanced_output = config.advanced_output;
let start = true;

async function saveItem(item) {
  try {
    const {url, login, password} = item;
		if (start) {
			fs.writeFileSync(filePath, '', { flag: 'w' });
			start = false;
		}
		
		const stream = fs.createWriteStream(filePath, { flags: 'a' });
    stream.write(`${url}:${login}:${password}\n`);
    stream.end();
    if (advanced_output) console.log('Гуд успешно сохранен.');
  } catch (error) {
    if (advanced_output) console.error('Ошибка сохранения гуда:', error.message);
  }
}

module.exports = { saveItem };
