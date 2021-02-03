# twilio-bodypix-test

## 概要

- Twillioのビデオチャット機能にbodyPixで背景ボカシを入れるサンプル  
- Next.jsを利用

## 使い方

- <https://cloudapi.kddi-web.com/> でアカウントを取得
- <https://jp.twilio.com/console/video/configure> でRoom設定(テストだけならTypeは無料のGoを推奨)
- <https://jp.twilio.com/console> でアカウントキーを確認
- <https://jp.twilio.com/console/video/project/api-keys> でAPIキーを取得
- .envにキーを設定
- yarn でパッケージのインストール
- yarn dev で起動
- <http://localhost:3000> でタブを二つ開くと、画面上にローカル、画面下にサーバ経由のビデオが表示される
- ブラウザのタブごとにroom接続用の固有の名前を持たせているので、タブごとに別ユーザ扱い

## .env

設定する物

```txt
ACCOUNT_SID = 
API_KEY_SID = 
API_KEY_SECRET = 
```

## 注意点

- ブラウザセキュリティの関係で、httpsにしないとlocalhost以外では動かない  
- .envはgitignoreに加えてあるものの、他のファイルに書いてAPIキーを流出させないように
