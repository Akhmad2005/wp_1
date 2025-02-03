const fs = require('fs');
const split2 = require('split2');
const { saveItem } = require('./helpers/goodsSaver')
const { getPrecentage, countLinesInFile } = require('./helpers/utils')
const { Worker } = require('worker_threads');
const path = require('path');
require('dotenv').config();

const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));
const threadCount = config.thread_count
const batchSize = config.batch_size
const advanced_output = config.advanced_output;
let linesRead = 0;
let endOfFile = false;
const workers = [];
const stats = {
  goods: 0,
  bads: 0,
  errors: 0,
  linesCount: 0,
  linesDone: 0,
}

const workersQueue = [];

let workersQueueInterval = setInterval(() => {
  let worker = workersQueue.shift()
  if (worker) {
    runWorker(worker)
  } 
}, 1000)

function createWorker() {
  return new Worker(path.resolve(__dirname, './worker.js'));
}

async function sliceLines() {
  const lines = [];
  let currentLine = 0;
  const startLine = linesRead + 1;
  const endLine = startLine + batchSize;
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(config.input_file_path)
      .pipe(split2())
      .on('data', (line) => {
        currentLine++;
        if (currentLine >= startLine && currentLine < endLine) {
          lines.push(line);
        }
        if (currentLine > endLine) {
          stream.destroy();
        }
      })
      .on('close', () => {
        linesRead += lines?.length || 0;
        if (!lines?.length || batchSize > lines?.length) {
          endOfFile = true;
        }
        resolve(lines);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

for (let i = 0; i < threadCount; i++) {
  const worker = createWorker();
  worker.on('message', async ({type, length, good_data}) => {
    try {
      switch (type) {
        case 'done':
          worker.active = false
          workersQueue.push(worker);
          break;
        case 'write_good': 
          console.log('найдено совпадение! Записываем в файл...');
          await saveItem(good_data)
          break;
        case 'line_good': 
          stats.goods++;
          break;
        case 'line_bad': 
          stats.bads++;
          break;
        case 'line_error': 
          stats.errors++;
          break;
        case 'line_done': 
          stats.linesDone++;
          break;
      }
    } catch (error) {
      if (advanced_output) console.log('Ошибка при получении сообщения с потока', error?.message);
    }
  });

  worker.on('error', (err) => {
    if (advanced_output) {
      console.error(`В потоке ${worker.threadId} обнаружена ошибка:`, err);
    }
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      if (advanced_output) {
        console.error(`Поток ${worker.threadId} завершился с кодом ${code}`);
      }
    }
  });

  workers.push(worker);
}

async function runWorker(worker) {
  if (endOfFile) {
    worker?.terminate();
  } else {
    const batch = await sliceLines();
    if (!batch || !batch.length) {
      worker?.terminate();
    } else {
      worker.active = true;
      worker.postMessage({ type: 'run', batch });
    }
  }
}

const getActiveWorkersCount = () => {
  return workers.filter(w => w.active).length;
}

const logStat = async () => {
  const intervalId = setInterval(() => {
    const now = new Date();
    const formattedTime = now.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    console.log(`[${formattedTime}] Проверка ${stats.linesDone}/${stats.linesCount}, Гуды: ${stats.goods}, Бэды: ${stats.bads}, Ошибки: ${stats.errors}, Потоки: ${getActiveWorkersCount()}/${threadCount}, Прогресс: ${getPrecentage(stats.linesDone, stats.linesCount)}%`);
    if (endOfFile && !getActiveWorkersCount()) {
      console.log('Процесс завершен.');
      clearInterval(intervalId);
      clearInterval(workersQueueInterval);
      process.exit();
    }
  }, 10000);
}

async function init () {
  console.log('Процесс запущен.');
  for (const worker of workers) {
    await runWorker(worker);
  }
  stats.linesCount = await countLinesInFile(config.input_file_path);
  logStat();
}

init();