const fs = require('fs');

let output = [];

async function saveItem(item) {
  output.push(item);
}

function writeToFile() {
  const jsonOutput = JSON.stringify(output, null, 2);
  fs.writeFile('goods.json', jsonOutput, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('File written successfully');
    }
  });
}

module.exports = { saveItem, writeToFile };