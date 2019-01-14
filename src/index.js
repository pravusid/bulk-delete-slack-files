const readline = require('readline');
const request = require('request');
const fs = require('fs');
const sleep = require('sleep');

let token = '';

const http = () => request.defaults({
  baseUrl: 'https://slack.com/api',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (msg, callback) => {
  rl.question(msg, (line) => {
    if (!line) {
      rl.write('종료합니다');
      rl.close();
      return;
    }
    callback(line);
  });
};

const getList = (daysBefore = 0, page = 1) => new Promise((resolve, reject) => {
  http().get(
    '/files.list',
    {
      headers: {
        'Accepted-content-types': 'application/x-www-form-urlencoded',
      },
      qs: {
        page,
        ts_to: Math.floor((Date.now() - daysBefore * 86400000) / 1000),
      },
    },
    (err, resp) => {
      if (err !== null) {
        reject(new Error('통신과정중 오류발생\n'));
        return;
      }

      const parsedResp = JSON.parse(resp.body);

      if (!parsedResp.ok) {
        reject(new Error('api에서 유효하지 않은 응답\n'));
        return;
      }

      const { paging, files } = parsedResp;
      resolve({ paging, files });
    },
  );
});

const getEntireList = (daysBefore, paging) => Promise.all(
  [...Array(paging.pages).keys()].map(p => getList(daysBefore, p + 1)),
);

const downloadFile = file => new Promise((resolve, reject) => {
  if (!file.url_private_download) return;
  http()
    .get(file.url_private_download, { baseUrl: '' })
    .on('response', () => resolve())
    .on('error', error => reject(error))
    .pipe(fs.createWriteStream(`./backup/${file.timestamp}_${file.id}_${file.name}`))
    .close();
});

const deleteFile = (fileId) => {
  http().post(
    '/files.delete',
    {
      headers: {
        'Accepted-content-types': 'application/json',
      },
      formData: {
        file: fileId,
      },
    },
    (err, resp) => {
      process.stdout.write(resp.body);
      sleep.msleep(1500);
    },
  );
};

const deleteFiles = (days, paging) => {
  getEntireList(days, paging)
    .then((res) => {
      process.stdout.write(`삭제대상 파일은 ${res[0].paging.total}개 입니다\n`);
      res.forEach(list => list.files.forEach((f) => {
        downloadFile(f)
          .then(() => deleteFile(f.id))
          .catch(err => console.error(err));
      }));
    })
    .catch(err => console.error(err));
};

const main = () => {
  if (!fs.existsSync('./backup')) {
    fs.mkdirSync('./backup');
  }
  const operation = () => {
    getList()
      .then((res) => {
        const { total } = res.paging;
        rl.write(`파일 개수는 총 ${total}개 입니다\n`);
        if (total === 0) {
          rl.write('삭제할 파일이 없으므로 종료합니다');
          rl.close();
          return;
        }

        question('보존할 파일의 기간을 입력하세요(입력한 날짜 이전 삭제)', (days) => {
          rl.write(`${days}일 이전 파일을 삭제합니다\n`);
          rl.close();
          deleteFiles(days, res.paging);
        });
      })
      .catch(err => console.error(err));
  };

  fs.readFile('.token', 'utf8', (err, data) => {
    if (data) {
      token = data.replace(/[\r|\n|\r\n]$/, '');
      operation();
    } else {
      question('TOKEN을 입력하세요', (input) => {
        token = input;
        operation();
      });
    }
  });
};

main();
