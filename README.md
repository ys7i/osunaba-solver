# osunaba-solver

![icon](/public/icon128.png)  
osunaba-solver は[プログラミング言語の基礎概念](http://www.fos.kuis.kyoto-u.ac.jp/~igarashi/CoPL/index.cgi)の演習システムを自動で解く Google Chrome の拡張機能です。

> 現在は導出システム EvalML1 まで対応しています。

## 使い方

このリポジトリを clone し、以下のコマンドを実行

```
$ cd osunaba-solver
$ yarn install
$ yarn build
```

で osunaba-solver 直下に dist ディレクトリが出来たことを確認

Google Chrome で[manage Extension](chrome://extensions/)にアクセスし、画面右上の Developer mode をオンにする。  
画面左上の Load unpacked から osunaba-solver/dist を選択  
これで拡張機能の読み込みは完了です。

[プログラミング言語の基礎概念](http://www.fos.kuis.kyoto-u.ac.jp/~igarashi/CoPL/index.cgi)で演習システムのユーザー登録を済ませて、問題セクションから問題ページに飛ぶと、フォームの解答を送信ボタンの下に"solve!"ボタンが現れます。  
このボタンを押すと解答が自動で入力されますのであとはフォームの解答を送信するだけです。
