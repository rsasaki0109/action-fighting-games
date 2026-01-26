# Internet Meme All-Stars

## 概要
Phaser 3を使用した2D横スクロール対戦アクションゲーム（スマブラ風）

## 技術スタック
- Phaser 3 (CDN経由)
- Vanilla JavaScript
- HTML5 Canvas

## ファイル構成
```
.
├── index.html      # エントリーポイント
├── main.js         # ゲームロジック全体
└── assets/
    └── characters/ # キャラ画像 (PNG/SVG)
```

## ゲームモード
- 1P vs CPU (Easy/Normal/Hard)
- 2P vs 2P (1端末共有)

## キャラクター
| キャラ | 特殊能力 |
|--------|----------|
| Doge | 二段ジャンプ、攻撃硬直短 |
| Trollface | スーパーアーマー、操作反転、広範囲攻撃 |
| Pepe | 遠距離攻撃（涙弾） |
| Wojak | カウンター技 |
| Nyan Cat | 三段ジャンプ、虹エフェクト |

## バトルシステム
- **必殺技ゲージ**: 攻撃命中/被ダメージで溜まり、MAXで強力な必殺技発動
- **コンボシステム**: 連続攻撃でダメージボーナス (15%/コンボ)
- **アイテム**: 回復、攻撃力UP、スピードUP がランダム出現
- **ステージギミック**: 浮遊プラットフォーム、動く床

## シーン構成
1. `PreloadScene` - アセット読み込み
2. `TitleScene` - タイトル画面
3. `ModeSelectScene` - モード選択
4. `SelectScene` - キャラ選択
5. `BattleScene` - バトル本体
6. `VictoryScene` - 勝利画面

## 開発コマンド
```bash
# ローカル確認
python3 -m http.server 8000
# または
npx serve .
```

## 動画録画
Puppeteerでヘッドレス録画 → ffmpegでGIF変換
```bash
npm install puppeteer --save-dev
node record-game.js
ffmpeg -framerate 20 -i recording/frame_%04d.png -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" output.gif
```

## TODO
- [ ] サウンド（SE/BGM）
- [ ] ガード/回避
- [ ] 空中攻撃
