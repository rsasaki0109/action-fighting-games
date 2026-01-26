// Internet Meme All-Stars (IMA)
// 2D横対戦アクション（スマブラ風）

// ゲーム設定
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;

// キャラクター定義
const CHARACTERS = {
    doge: {
        name: 'Doge',
        color: 0xffcc00,
        speed: 1.2,
        damage: 10,
        knockback: 0.8,
        special: 'instantKO', // 30%で即死
        image: 'doge'
    },
    trollface: {
        name: 'Trollface',
        color: 0xffffff,
        speed: 0.8,
        damage: 20,
        knockback: 1.5,
        special: 'reverseControl', // 操作反転0.5秒
        image: 'trollface'
    }
};

// ゲーム定数
const GRAVITY = 1200;
const BASE_SPEED = 200;
const JUMP_VELOCITY = -500;
const GROUND_Y = GAME_HEIGHT - 80;
const RESPAWN_INVINCIBLE_TIME = 1000;
const REVERSE_CONTROL_TIME = 500;
const STOCKS = 3;

// プリロードシーン（共通アセット読み込み）
class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // ローディングテキスト
        const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // キャラ画像読み込み
        this.load.image('doge', 'assets/characters/doge.png');
        this.load.image('trollface', 'assets/characters/trollface.png');
    }

    create() {
        this.scene.start('TitleScene');
    }
}

// タイトルシーン
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // 背景
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // タイトルテキスト
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'INTERNET MEME\nALL-STARS', {
            fontSize: '48px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: '#ff6b6b',
            align: 'center',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // キャラプレビュー
        const dogePreview = this.add.image(GAME_WIDTH / 3, GAME_HEIGHT / 2 + 20, 'doge')
            .setDisplaySize(80, 80);
        const trollPreview = this.add.image(GAME_WIDTH * 2 / 3, GAME_HEIGHT / 2 + 20, 'trollface')
            .setDisplaySize(80, 80);

        // TAP TO START（点滅）
        const startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.8, 'TAP TO START', {
            fontSize: '28px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // タップで次へ
        this.input.on('pointerdown', () => {
            this.scene.start('SelectScene');
        });
    }
}

// キャラ選択シーン
class SelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SelectScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#16213e');
        this.selectedChars = { p1: null, p2: null };
        this.p1Buttons = {};
        this.p2Buttons = {};

        // タイトル
        this.add.text(GAME_WIDTH / 2, 40, 'SELECT YOUR MEME', {
            fontSize: '32px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: '#e94560',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 分割線
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x444444);
        graphics.lineBetween(GAME_WIDTH / 2, 80, GAME_WIDTH / 2, GAME_HEIGHT - 40);

        // P1側
        this.add.text(GAME_WIDTH / 4, 80, 'PLAYER 1', {
            fontSize: '24px',
            color: '#4ecdc4'
        }).setOrigin(0.5);

        // P2側
        this.add.text(GAME_WIDTH * 3 / 4, 80, 'PLAYER 2', {
            fontSize: '24px',
            color: '#ff6b6b'
        }).setOrigin(0.5);

        // キャラボタン作成
        this.createCharButton('doge', GAME_WIDTH / 4, 160, 1);
        this.createCharButton('trollface', GAME_WIDTH / 4, 280, 1);
        this.createCharButton('doge', GAME_WIDTH * 3 / 4, 160, 2);
        this.createCharButton('trollface', GAME_WIDTH * 3 / 4, 280, 2);

        // 選択表示テキスト
        this.p1SelectText = this.add.text(GAME_WIDTH / 4, GAME_HEIGHT - 50, '選択: ???', {
            fontSize: '20px',
            color: '#4ecdc4'
        }).setOrigin(0.5);

        this.p2SelectText = this.add.text(GAME_WIDTH * 3 / 4, GAME_HEIGHT - 50, '選択: ???', {
            fontSize: '20px',
            color: '#ff6b6b'
        }).setOrigin(0.5);
    }

    createCharButton(charKey, x, y, player) {
        const char = CHARACTERS[charKey];
        const playerColor = player === 1 ? 0x4ecdc4 : 0xff6b6b;

        // ボタン背景
        const bg = this.add.rectangle(x, y, 140, 80, 0x333333)
            .setStrokeStyle(3, 0x555555)
            .setInteractive();

        // キャラ画像
        const charImage = this.add.image(x - 35, y, charKey)
            .setDisplaySize(50, 50);

        // キャラ名
        const text = this.add.text(x + 20, y, char.name, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        // ボタン参照を保存
        const buttonKey = `${player}_${charKey}`;
        if (player === 1) {
            this.p1Buttons[charKey] = bg;
        } else {
            this.p2Buttons[charKey] = bg;
        }

        // タップイベント
        bg.on('pointerdown', () => {
            this.selectChar(charKey, player, bg, playerColor);
        });
    }

    selectChar(charKey, player, button, playerColor) {
        const char = CHARACTERS[charKey];
        const buttons = player === 1 ? this.p1Buttons : this.p2Buttons;

        // 全ボタンのスタイルリセット
        Object.values(buttons).forEach(btn => {
            btn.setStrokeStyle(3, 0x555555);
        });

        // 選択したボタンをハイライト
        button.setStrokeStyle(4, playerColor);

        if (player === 1) {
            this.selectedChars.p1 = charKey;
            this.p1SelectText.setText(`選択: ${char.name}`);
        } else {
            this.selectedChars.p2 = charKey;
            this.p2SelectText.setText(`選択: ${char.name}`);
        }

        // 選択エフェクト
        this.tweens.add({
            targets: button,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100,
            yoyo: true
        });

        // 両者選択完了チェック
        if (this.selectedChars.p1 && this.selectedChars.p2) {
            this.time.delayedCall(500, () => {
                this.scene.start('BattleScene', {
                    p1Char: this.selectedChars.p1,
                    p2Char: this.selectedChars.p2
                });
            });
        }
    }
}

// バトルシーン
class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.p1Char = data.p1Char || 'doge';
        this.p2Char = data.p2Char || 'trollface';
    }

    create() {
        this.cameras.main.setBackgroundColor('#0f0f23');

        // ステージ（床）
        this.floor = this.add.rectangle(GAME_WIDTH / 2, GROUND_Y + 30, GAME_WIDTH - 100, 20, 0x444444);
        this.physics.add.existing(this.floor, true);

        // プレイヤー作成
        this.player1 = this.createPlayer(1, this.p1Char, GAME_WIDTH / 3);
        this.player2 = this.createPlayer(2, this.p2Char, GAME_WIDTH * 2 / 3);

        // 物理衝突
        this.physics.add.collider(this.player1.sprite, this.floor);
        this.physics.add.collider(this.player2.sprite, this.floor);

        // UI作成
        this.createUI();

        // 操作ボタン作成
        this.createControls();

        // 更新処理
        this.gameOver = false;
    }

    createPlayer(num, charKey, x) {
        const charData = CHARACTERS[charKey];
        const playerColor = num === 1 ? 0x4ecdc4 : 0xff6b6b;

        // キャラスプライト（画像使用）
        const sprite = this.add.image(x, GROUND_Y - 40, charKey);
        sprite.setDisplaySize(60, 60);

        // 物理ボディ追加
        this.physics.add.existing(sprite);
        sprite.body.setCollideWorldBounds(false);
        sprite.body.setGravityY(GRAVITY);
        sprite.body.setBounce(0);
        sprite.body.setDrag(200, 0);
        sprite.body.setSize(50, 55);

        // プレイヤー識別用の枠線（別オブジェクト）
        const outline = this.add.rectangle(x, GROUND_Y - 40, 65, 65)
            .setStrokeStyle(3, playerColor)
            .setFillStyle(0x000000, 0);

        // P番号ラベル
        const label = this.add.text(x, GROUND_Y - 80, `P${num}`, {
            fontSize: '14px',
            fontFamily: 'Arial Black, sans-serif',
            color: num === 1 ? '#4ecdc4' : '#ff6b6b',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        return {
            num,
            sprite,
            outline,
            label,
            charKey,
            charData,
            damage: 0,
            stocks: STOCKS,
            invincible: false,
            reverseControl: false,
            isAttacking: false,
            facingRight: num === 1
        };
    }

    createUI() {
        // P1 UI（左下）
        this.p1DamageText = this.add.text(20, GAME_HEIGHT - 70, '0%', {
            fontSize: '32px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: '#4ecdc4'
        });
        this.p1StocksContainer = this.add.container(20, GAME_HEIGHT - 30);
        this.updateStockDisplay(1);

        // P2 UI（右下）
        this.p2DamageText = this.add.text(GAME_WIDTH - 100, GAME_HEIGHT - 70, '0%', {
            fontSize: '32px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: '#ff6b6b'
        });
        this.p2StocksContainer = this.add.container(GAME_WIDTH - 100, GAME_HEIGHT - 30);
        this.updateStockDisplay(2);
    }

    updateStockDisplay(playerNum) {
        const container = playerNum === 1 ? this.p1StocksContainer : this.p2StocksContainer;
        const player = playerNum === 1 ? this.player1 : this.player2;
        const color = playerNum === 1 ? 0x4ecdc4 : 0xff6b6b;

        container.removeAll(true);

        for (let i = 0; i < STOCKS; i++) {
            const fillColor = i < player.stocks ? color : 0x333333;
            const stock = this.add.circle(i * 25, 0, 8, fillColor);
            container.add(stock);
        }
    }

    createControls() {
        // P1操作（画面左側）
        this.createButton(30, GAME_HEIGHT - 160, '←', () => this.movePlayer(1, -1));
        this.createButton(100, GAME_HEIGHT - 200, '↑', () => this.jumpPlayer(1));
        this.createButton(170, GAME_HEIGHT - 160, '→', () => this.movePlayer(1, 1));
        this.createButton(100, GAME_HEIGHT - 160, 'ATK', () => this.attackPlayer(1), 0xe94560);

        // P2操作（画面右側）
        this.createButton(GAME_WIDTH - 230, GAME_HEIGHT - 160, '←', () => this.movePlayer(2, -1));
        this.createButton(GAME_WIDTH - 160, GAME_HEIGHT - 200, '↑', () => this.jumpPlayer(2));
        this.createButton(GAME_WIDTH - 90, GAME_HEIGHT - 160, '→', () => this.movePlayer(2, 1));
        this.createButton(GAME_WIDTH - 160, GAME_HEIGHT - 160, 'ATK', () => this.attackPlayer(2), 0xe94560);
    }

    createButton(x, y, text, callback, color = 0x333333) {
        const btn = this.add.rectangle(x, y, 55, 45, color)
            .setStrokeStyle(2, 0x666666)
            .setInteractive()
            .setAlpha(0.8);

        this.add.text(x, y, text, {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerdown', callback);

        // 押しっぱなし対応
        btn.on('pointerover', () => {
            if (this.input.activePointer.isDown) {
                callback();
            }
        });

        return btn;
    }

    movePlayer(playerNum, direction) {
        const player = playerNum === 1 ? this.player1 : this.player2;
        if (this.gameOver) return;

        // 操作反転チェック
        const actualDir = player.reverseControl ? -direction : direction;

        const speed = BASE_SPEED * player.charData.speed;
        player.sprite.body.setVelocityX(actualDir * speed);
        player.facingRight = actualDir > 0;

        // 向きに応じて画像を反転
        player.sprite.setFlipX(!player.facingRight);
    }

    jumpPlayer(playerNum) {
        const player = playerNum === 1 ? this.player1 : this.player2;
        if (this.gameOver) return;

        // 地面にいる時のみジャンプ
        if (player.sprite.body.blocked.down || player.sprite.y >= GROUND_Y - 40) {
            const jumpDir = player.reverseControl ? -JUMP_VELOCITY : JUMP_VELOCITY;
            player.sprite.body.setVelocityY(jumpDir);
        }
    }

    attackPlayer(playerNum) {
        const attacker = playerNum === 1 ? this.player1 : this.player2;
        const defender = playerNum === 1 ? this.player2 : this.player1;
        if (this.gameOver || attacker.isAttacking) return;

        attacker.isAttacking = true;

        // 攻撃エフェクト
        const attackDir = attacker.facingRight ? 1 : -1;
        const attackX = attacker.sprite.x + (attackDir * 40);
        const attackHitbox = this.add.rectangle(attackX, attacker.sprite.y, 40, 50, 0xff0000, 0.5);

        this.time.delayedCall(100, () => {
            attackHitbox.destroy();
            attacker.isAttacking = false;
        });

        // 当たり判定
        const dx = Math.abs(attacker.sprite.x - defender.sprite.x);
        const dy = Math.abs(attacker.sprite.y - defender.sprite.y);
        const inRange = dx < 70 && dy < 50;

        if (inRange && !defender.invincible) {
            this.applyHit(attacker, defender);
        }
    }

    applyHit(attacker, defender) {
        const damage = attacker.charData.damage;
        defender.damage += damage;

        // ダメージ表示更新
        if (defender.num === 1) {
            this.p1DamageText.setText(`${defender.damage}%`);
        } else {
            this.p2DamageText.setText(`${defender.damage}%`);
        }

        // ノックバック計算
        let knockbackPower = attacker.charData.knockback * (1 + defender.damage / 100);

        // Doge特殊効果：30%で即死ノックバック
        if (attacker.charKey === 'doge' && Math.random() < 0.3) {
            knockbackPower *= 5;
            this.showText('MUCH WOW!', defender.sprite.x, defender.sprite.y - 50, '#ffcc00');
        }

        // Trollface特殊効果：操作反転
        if (attacker.charKey === 'trollface') {
            defender.reverseControl = true;
            this.showText('U MAD?', defender.sprite.x, defender.sprite.y - 50, '#ffffff');
            this.time.delayedCall(REVERSE_CONTROL_TIME, () => {
                defender.reverseControl = false;
            });
        }

        // ノックバック適用
        const knockbackDir = attacker.sprite.x < defender.sprite.x ? 1 : -1;
        const knockbackX = knockbackDir * knockbackPower * 400;
        const knockbackY = -knockbackPower * 300;

        defender.sprite.body.setVelocity(knockbackX, knockbackY);

        // ヒットエフェクト
        this.cameras.main.shake(100, 0.01);
        this.tweens.add({
            targets: [defender.sprite, defender.outline],
            alpha: 0.5,
            duration: 50,
            yoyo: true
        });

        // ヒットSE表示（実際の音は省略）
        const seText = Math.random() < 0.5 ? 'BONK!' : 'BRUH!';
        this.showText(seText, defender.sprite.x, defender.sprite.y - 30, '#ff6b6b');
    }

    showText(text, x, y, color) {
        const txt = this.add.text(x, y, text, {
            fontSize: '24px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: color,
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 50,
            alpha: 0,
            duration: 500,
            onComplete: () => txt.destroy()
        });
    }

    update() {
        if (this.gameOver) return;

        // ラベル・枠線位置更新
        this.player1.label.setPosition(this.player1.sprite.x, this.player1.sprite.y - 45);
        this.player1.outline.setPosition(this.player1.sprite.x, this.player1.sprite.y);
        this.player2.label.setPosition(this.player2.sprite.x, this.player2.sprite.y - 45);
        this.player2.outline.setPosition(this.player2.sprite.x, this.player2.sprite.y);

        // KO判定
        this.checkKO(this.player1);
        this.checkKO(this.player2);
    }

    checkKO(player) {
        const { x, y } = player.sprite;
        const margin = 100;

        if (x < -margin || x > GAME_WIDTH + margin ||
            y < -margin || y > GAME_HEIGHT + margin) {
            this.handleKO(player);
        }
    }

    handleKO(player) {
        player.stocks--;
        this.updateStockDisplay(player.num);

        // KO演出
        this.showText('GET RATIOED', GAME_WIDTH / 2, GAME_HEIGHT / 2, '#e94560');
        this.cameras.main.shake(200, 0.02);

        if (player.stocks <= 0) {
            // 勝敗決定
            const winner = player.num === 1 ? 2 : 1;
            const winnerChar = winner === 1 ? this.p1Char : this.p2Char;
            this.gameOver = true;
            this.time.delayedCall(1000, () => {
                this.scene.start('VictoryScene', { winner, winnerChar });
            });
        } else {
            // リスポーン
            this.respawnPlayer(player);
        }
    }

    respawnPlayer(player) {
        player.damage = 0;
        player.sprite.x = player.num === 1 ? GAME_WIDTH / 3 : GAME_WIDTH * 2 / 3;
        player.sprite.y = 100;
        player.sprite.body.setVelocity(0, 0);
        player.invincible = true;
        player.reverseControl = false;

        // ダメージ表示リセット
        if (player.num === 1) {
            this.p1DamageText.setText('0%');
        } else {
            this.p2DamageText.setText('0%');
        }

        // 無敵エフェクト（点滅）
        this.tweens.add({
            targets: [player.sprite, player.outline],
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 5
        });

        this.time.delayedCall(RESPAWN_INVINCIBLE_TIME, () => {
            player.invincible = false;
            player.sprite.alpha = 1;
            player.outline.alpha = 1;
        });
    }
}

// 勝利シーン
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.winner = data.winner || 1;
        this.winnerChar = data.winnerChar || 'doge';
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // 勝者テキスト
        const winnerColor = this.winner === 1 ? '#4ecdc4' : '#ff6b6b';
        this.add.text(GAME_WIDTH / 2, 80, `PLAYER ${this.winner} WINS!`, {
            fontSize: '48px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: winnerColor,
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // 勝者キャラ（大きく表示）
        const winnerImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, this.winnerChar);
        winnerImage.setDisplaySize(180, 180);

        // 勝者画像アニメーション
        this.tweens.add({
            targets: winnerImage,
            scale: { from: 0, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });

        // 紙吹雪エフェクト
        for (let i = 0; i < 50; i++) {
            const confetti = this.add.rectangle(
                Math.random() * GAME_WIDTH,
                -20,
                10,
                10,
                Phaser.Display.Color.RandomRGB().color
            );

            this.tweens.add({
                targets: confetti,
                y: GAME_HEIGHT + 20,
                x: confetti.x + (Math.random() - 0.5) * 200,
                rotation: Math.random() * 10,
                duration: 2000 + Math.random() * 2000,
                repeat: -1,
                delay: Math.random() * 1000
            });
        }

        // TAP TO RETRY
        const retryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'TAP TO RETRY', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: retryText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // タップでタイトルへ
        this.input.on('pointerdown', () => {
            this.scene.start('TitleScene');
        });
    }
}

// Phaser設定
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [PreloadScene, TitleScene, SelectScene, BattleScene, VictoryScene],
    input: {
        activePointers: 4 // マルチタッチ対応
    }
};

// ゲーム起動
const game = new Phaser.Game(config);

// 画面向き警告（ポートレートの場合）
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

function checkOrientation() {
    // 横画面推奨のメッセージは必要に応じて追加
}
