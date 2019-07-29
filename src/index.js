const readline = require('readline');
const fs = require('fs');
const axios = require('axios');

let http;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = msg =>
  new Promise(resolve => {
    rl.question(msg, line => resolve(line));
  });

const waitSeconds = msec =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, msec);
  });

const getList = async (daysBefore = 0, page = 1) => {
  const response = await http.get('/files.list', {
    headers: {
      'Accepted-content-types': 'application/x-www-form-urlencoded',
    },
    params: {
      page,
      ts_to: Math.floor((Date.now() - daysBefore * 86400000) / 1000),
    },
  });
  const body = response.data;
  const { paging, files } = body;
  return { paging, files };
};

const getEntireList = (daysBefore, paging) =>
  Promise.all([...Array(paging.pages).keys()].map(p => getList(daysBefore, p + 1)));

const downloadFile = async file => {
  if (!file.url_private_download) {
    return;
  }
  const response = await http.get(file.url_private_download, {
    baseURL: '',
    responseType: 'stream',
  });
  response.data.pipe(fs.createWriteStream(`./backup/${file.timestamp}_${file.id}_${file.name}`));
};

const deleteFile = async fileId => {
  const response = await http.post(
    '/files.delete',
    {
      file: fileId,
    },
    {
      headers: {
        'Accepted-content-types': 'application/json',
      },
    },
  );
  console.log(response.data);
};

const deleteFiles = async (days, paging) => {
  try {
    const entire = await getEntireList(days, paging);
    const [first] = entire;
    const targetSize = first.paging.total;
    console.log(`삭제대상 파일은 ${targetSize}개 입니다\n`);

    await entire.reduce(async (lPromise, piece) => {
      await lPromise;
      // eslint-disable-next-line
      return piece.files.reduce(async (fPromise, file) => {
        try {
          await fPromise;
          await downloadFile(file);
          await deleteFile(file.id);
          return targetSize > 50 ? waitSeconds(1200) : Promise.resolve();
        } catch (err) {
          console.error(err);
        }
      }, Promise.resolve());
    }, Promise.resolve());
  } catch (error) {
    console.error(error);
  }
};

const operation = async () => {
  try {
    const list = await getList();
    const { total } = list.paging;
    console.log(`파일 개수는 총 ${total}개 입니다\n`);
    if (total === 0) {
      console.log('삭제할 파일이 없습니다');
      return;
    }

    if (!fs.existsSync('./backup')) {
      fs.mkdirSync('./backup');
    }

    const days = await question(
      '보존할 파일의 기간을 입력하세요(입력한 날짜 이전 삭제)\nENTER를 입력하면 종료합니다\n',
    );
    if (!days) {
      return;
    }

    console.log(`${days}일 이전 파일을 삭제합니다\n`);
    await deleteFiles(days, list.paging);
  } catch (err) {
    console.error(err);
  }
};

const main = async () => {
  const data = fs.readFileSync('.token', 'utf8');
  const token = data ? data.replace(/[\r|\n|\r\n]$/, '') : await question('TOKEN을 입력하세요');
  http = axios.create({
    baseURL: 'https://slack.com/api',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  await operation();
};

/* main */
main()
  .then(() => {
    console.log('종료합니다');
    rl.close();
  })
  .catch(() => rl.close());
