const readline = require('readline');
const request = require('request');

const http = request.defaults({
  baseUrl: 'https://slack.com/api',
});

let token = '';

const getList = (count = 100) => new Promise((resolve, reject) => {
  http.get(
    '/files.list',
    {
      headers: {
        'Accepted-content-types': 'application/x-www-form-urlencoded',
      },
      qs: {
        token,
        count,
      },
    },
    (err, resp) => {
      if (err !== null) {
        reject(new Error('통신과정중 오류발생'));
        return;
      }

      const parsedResp = JSON.parse(resp.body);

      if (!parsedResp.ok) {
        reject(new Error('api에서 유효하지 않은 응답'));
        return;
      }

      const { paging, files } = parsedResp;
      resolve({ page: paging, files });
    },
  );
});

const deleteFile = (fileId) => {
  http.post(
    '/files.delete',
    {
      headers: {
        'Accepted-content-types': 'application/json',
      },
      formData: {
        token,
        file: fileId,
      },
    },
    (err, resp) => {
      console.log(resp.body);
    },
  );
};

const read = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const readonce = (callback) => {
  read.once('line', (line) => {
    if (!line) {
      console.log('종료합니다');
      read.close();
      return;
    }
    callback(line);
  });
};

console.log('TOKEN을 입력하세요');
readonce((line) => {
  token = line;
  getList()
    .then((res) => {
      console.log(`파일 개수는 총 ${res.page.total}개 입니다`);
    })
    .catch((err) => {
      console.error(err);
    })
    .then(() => {
      console.log('몇 개의 파일을 삭제할지 입력하세요');
      readonce((size) => {
        console.log(`${size}개의 파일을 삭제합니다`);
        getList(size)
          .then((res) => {
            res.files.forEach(f => deleteFile(f.id));
          })
          .catch(() => {
            console.log('오류발생');
          })
          .then(() => read.close());
      });
    });
});
