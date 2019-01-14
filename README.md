# Bulk delete slack files

Slack 파일 삭제를 위한 스크립트

- `.token` 파일을 생성하여 토큰을 입력해 놓거나, 콘솔에서 반복적으로 토큰 입력가능
- 지정한 날짜 이전의 파일을 모두 삭제함(콘솔에서 입력)

## Token

<https://api.slack.com/docs/token-types#user>

> User tokens represent the same access a user has to a workspace -- the channels, conversations, users, reactions, etc. they can see

token은 User와 동일한 접근권한을 가지므로 private 채널 및 공개 채널에 업로드된 파일은 자신의 것만 삭제할 수 있다.

따라서 공개채널의 모든 파일을 삭제하려면 User에게 관리 권한이 필요하고,
비공개 채널의 파일을 삭제하기 위해서는 Slack의 사용자별로 token을 생성하여 삭제작업을 해야 한다.

## Slack API

다음 두 권한을 가진 token을 발급받아야 함

<https://api.slack.com/apps>에서 App을 생성할 수 있다

- <https://api.slack.com/methods/files.list>
- <https://api.slack.com/methods/files.delete>
