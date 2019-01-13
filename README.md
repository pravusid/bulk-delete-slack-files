# Bulk delete slack files

Slack 파일 삭제를 위한 스크립트

- `.token` 파일을 생성하여 토큰을 입력해 놓거나, 콘솔에서 반복적으로 토큰 입력가능
- 지정한 날짜 이전의 파일을 모두 삭제함(콘솔에서 입력)

## Slack API

다음 두 권한을 가진 token을 발급받아야 함

<https://api.slack.com/apps>에서 App을 생성할 수 있다

- <https://api.slack.com/methods/files.list>
- <https://api.slack.com/methods/files.delete>
