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
        doubleJump: true, // 二段ジャンプ
        attackCooldown: 80, // 攻撃硬直短め（通常100）
        attackRange: 70,
        image: 'doge',
        description: '高速移動・二段ジャンプ'
    },
    trollface: {
        name: 'Trollface',
        color: 0xffffff,
        speed: 0.8,
        damage: 20,
        knockback: 1.5,
        special: 'reverseControl', // 操作反転0.5秒
        superArmor: true, // 攻撃中ノックバック無効
        attackCooldown: 120,
        attackRange: 90, // 攻撃範囲広め
        image: 'trollface',
        description: '高火力・スーパーアーマー'
    },
    pepe: {
        name: 'Pepe',
        color: 0x3cb371,
        speed: 0.9,
        damage: 12,
        knockback: 0.6,
        special: 'rangedAttack', // 遠距離攻撃（涙を飛ばす）
        attackCooldown: 150,
        attackRange: 200, // 遠距離
        image: 'pepe',
        description: '遠距離攻撃（涙弾）'
    },
    wojak: {
        name: 'Wojak',
        color: 0xf5deb3,
        speed: 1.0,
        damage: 15,
        knockback: 1.2,
        special: 'counter', // カウンター技
        attackCooldown: 100,
        attackRange: 70,
        image: 'wojak',
        description: 'カウンター技持ち'
    },
    nyancat: {
        name: 'Nyan Cat',
        color: 0xff69b4,
        speed: 1.1,
        damage: 8,
        knockback: 0.5,
        special: 'airMobility', // 空中機動力UP
        doubleJump: true,
        tripleJump: true, // 三段ジャンプ！
        attackCooldown: 90,
        attackRange: 70,
        image: 'nyancat',
        description: '空中機動力UP・三段ジャンプ'
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

// CPU難易度設定
const CPU_DIFFICULTY = {
    easy: {
        reactionTime: 800,
        accuracy: 0.5,
        aggressiveness: 0.3
    },
    normal: {
        reactionTime: 400,
        accuracy: 0.7,
        aggressiveness: 0.5
    },
    hard: {
        reactionTime: 200,
        accuracy: 0.9,
        aggressiveness: 0.7
    }
};

// ゲームモード
let gameMode = '2p'; // '1p' or '2p'
let cpuDifficulty = 'normal';

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
        this.load.svg('pepe', 'assets/characters/pepe.svg', { width: 100, height: 100 });
        this.load.svg('wojak', 'assets/characters/wojak.svg', { width: 100, height: 100 });
        this.load.svg('nyancat', 'assets/characters/nyancat.svg', { width: 100, height: 100 });
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

        // キャラプレビュー（全キャラ表示）
        const charKeys = Object.keys(CHARACTERS);
        const spacing = GAME_WIDTH / (charKeys.length + 1);
        charKeys.forEach((key, i) => {
            this.add.image(spacing * (i + 1), GAME_HEIGHT / 2 + 20, key)
                .setDisplaySize(50, 50);
        });

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
            this.scene.start('ModeSelectScene');
        });
    }
}

// モード選択シーン
class ModeSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ModeSelectScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#16213e');

        // タイトル
        this.add.text(GAME_WIDTH / 2, 60, 'SELECT MODE', {
            fontSize: '36px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: '#e94560',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 1P vs CPU ボタン
        this.createModeButton(GAME_WIDTH / 2, 160, '1P vs CPU', '1p', 0x4ecdc4);

        // 2P対戦 ボタン
        this.createModeButton(GAME_WIDTH / 2, 250, '2P VS 2P', '2p', 0xff6b6b);

        // 難易度選択（1Pモード用）
        this.add.text(GAME_WIDTH / 2, 320, 'CPU DIFFICULTY', {
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5);

        this.difficultyButtons = {};
        this.createDifficultyButton(GAME_WIDTH / 2 - 120, 370, 'EASY', 'easy');
        this.createDifficultyButton(GAME_WIDTH / 2, 370, 'NORMAL', 'normal');
        this.createDifficultyButton(GAME_WIDTH / 2 + 120, 370, 'HARD', 'hard');

        // デフォルト選択
        this.updateDifficultySelection();
    }

    createModeButton(x, y, text, mode, color) {
        const btn = this.add.rectangle(x, y, 250, 60, 0x333333)
            .setStrokeStyle(3, color)
            .setInteractive();

        this.add.text(x, y, text, {
            fontSize: '28px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            gameMode = mode;
            this.scene.start('SelectScene');
        });

        btn.on('pointerover', () => btn.setFillStyle(0x444444));
        btn.on('pointerout', () => btn.setFillStyle(0x333333));
    }

    createDifficultyButton(x, y, text, difficulty) {
        const btn = this.add.rectangle(x, y, 100, 40, 0x333333)
            .setStrokeStyle(2, 0x555555)
            .setInteractive();

        const label = this.add.text(x, y, text, {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.difficultyButtons[difficulty] = { btn, label };

        btn.on('pointerdown', () => {
            cpuDifficulty = difficulty;
            this.updateDifficultySelection();
        });
    }

    updateDifficultySelection() {
        Object.keys(this.difficultyButtons).forEach(diff => {
            const { btn, label } = this.difficultyButtons[diff];
            if (diff === cpuDifficulty) {
                btn.setStrokeStyle(3, 0x4ecdc4);
                label.setColor('#4ecdc4');
            } else {
                btn.setStrokeStyle(2, 0x555555);
                label.setColor('#ffffff');
            }
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
        this.add.text(GAME_WIDTH / 2, 30, 'SELECT YOUR MEME', {
            fontSize: '28px',
            fontFamily: 'Impact, Arial Black, sans-serif',
            color: '#e94560',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 分割線
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x444444);
        graphics.lineBetween(GAME_WIDTH / 2, 60, GAME_WIDTH / 2, GAME_HEIGHT - 30);

        // P1側
        this.add.text(GAME_WIDTH / 4, 60, 'PLAYER 1', {
            fontSize: '20px',
            color: '#4ecdc4'
        }).setOrigin(0.5);

        // P2側（CPUモードの場合はCPU表示）
        const p2Label = gameMode === '1p' ? 'CPU' : 'PLAYER 2';
        this.add.text(GAME_WIDTH * 3 / 4, 60, p2Label, {
            fontSize: '20px',
            color: '#ff6b6b'
        }).setOrigin(0.5);

        // キャラボタン作成
        const charKeys = Object.keys(CHARACTERS);
        const startY = 100;
        const spacing = 70;

        charKeys.forEach((key, i) => {
            this.createCharButton(key, GAME_WIDTH / 4, startY + i * spacing, 1);
            this.createCharButton(key, GAME_WIDTH * 3 / 4, startY + i * spacing, 2);
        });

        // 選択表示テキスト
        this.p1SelectText = this.add.text(GAME_WIDTH / 4, GAME_HEIGHT - 20, '選択: ???', {
            fontSize: '16px',
            color: '#4ecdc4'
        }).setOrigin(0.5);

        this.p2SelectText = this.add.text(GAME_WIDTH * 3 / 4, GAME_HEIGHT - 20, '選択: ???', {
            fontSize: '16px',
            color: '#ff6b6b'
        }).setOrigin(0.5);

        // CPUモードの場合、P2をランダム選択
        if (gameMode === '1p') {
            const randomChar = charKeys[Math.floor(Math.random() * charKeys.length)];
            this.time.delayedCall(500, () => {
                this.selectChar(randomChar, 2, this.p2Buttons[randomChar], 0xff6b6b);
            });
        }
    }

    createCharButton(charKey, x, y, player) {
        const char = CHARACTERS[charKey];
        const playerColor = player === 1 ? 0x4ecdc4 : 0xff6b6b;

        // ボタン背景
        const bg = this.add.rectangle(x, y, 160, 55, 0x333333)
            .setStrokeStyle(2, 0x555555)
            .setInteractive();

        // キャラ画像
        this.add.image(x - 55, y, charKey)
            .setDisplaySize(40, 40);

        // キャラ名と説明
        this.add.text(x + 5, y - 10, char.name, {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.add.text(x + 5, y + 10, char.description, {
            fontSize: '10px',
            color: '#888888'
        }).setOrigin(0, 0.5);

        // ボタン参照を保存
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
            btn.setStrokeStyle(2, 0x555555);
        });

        // 選択したボタンをハイライト
        button.setStrokeStyle(3, playerColor);

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
                    p2Char: this.selectedChars.p2,
                    isCpuMode: gameMode === '1p'
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
        this.isCpuMode = data.isCpuMode || false;
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

        // 飛び道具グループ
        this.projectiles = this.add.group();

        // UI作成
        this.createUI();

        // 操作ボタン作成
        this.createControls();

        // CPU AI初期化
        if (this.isCpuMode) {
            this.cpuAI = {
                lastActionTime: 0,
                difficulty: CPU_DIFFICULTY[cpuDifficulty]
            };
        }

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

        // P番号ラベル（CPUモードの場合はCPU表示）
        const labelText = (num === 2 && this.isCpuMode) ? 'CPU' : `P${num}`;
        const label = this.add.text(x, GROUND_Y - 80, labelText, {
            fontSize: '14px',
            fontFamily: 'Arial Black, sans-serif',
            color: num === 1 ? '#4ecdc4' : '#ff6b6b',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Nyan Cat用虹エフェクト
        let rainbowTrail = null;
        if (charKey === 'nyancat') {
            rainbowTrail = [];
        }

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
            facingRight: num === 1,
            jumpCount: 0,
            maxJumps: charData.tripleJump ? 3 : (charData.doubleJump ? 2 : 1),
            isCountering: false,
            counterTimer: null,
            rainbowTrail
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

        // モード表示
        if (this.isCpuMode) {
            this.add.text(GAME_WIDTH / 2, 15, `VS CPU (${cpuDifficulty.toUpperCase()})`, {
                fontSize: '16px',
                color: '#888888'
            }).setOrigin(0.5);
        }
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

        // P2操作（CPUモードでない場合のみ）
        if (!this.isCpuMode) {
            this.createButton(GAME_WIDTH - 230, GAME_HEIGHT - 160, '←', () => this.movePlayer(2, -1));
            this.createButton(GAME_WIDTH - 160, GAME_HEIGHT - 200, '↑', () => this.jumpPlayer(2));
            this.createButton(GAME_WIDTH - 90, GAME_HEIGHT - 160, '→', () => this.movePlayer(2, 1));
            this.createButton(GAME_WIDTH - 160, GAME_HEIGHT - 160, 'ATK', () => this.attackPlayer(2), 0xe94560);
        }
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

        // 地面判定でジャンプカウントリセット
        if (player.sprite.body.blocked.down || player.sprite.y >= GROUND_Y - 40) {
            player.jumpCount = 0;
        }

        // ジャンプ可能判定
        if (player.jumpCount < player.maxJumps) {
            const jumpDir = player.reverseControl ? -JUMP_VELOCITY : JUMP_VELOCITY;

            // Nyan Cat: 空中ジャンプ時にもフルジャンプ力
            const jumpPower = (player.charKey === 'nyancat' && player.jumpCount > 0)
                ? jumpDir * 0.9
                : jumpDir;

            player.sprite.body.setVelocityY(jumpPower);
            player.jumpCount++;

            // 二段以上のジャンプ時にエフェクト
            if (player.jumpCount > 1) {
                this.showJumpEffect(player);
            }
        }
    }

    showJumpEffect(player) {
        const effectColor = player.charKey === 'nyancat' ? 0xff69b4 : 0xffffff;
        const effect = this.add.circle(player.sprite.x, player.sprite.y + 20, 15, effectColor, 0.5);
        this.tweens.add({
            targets: effect,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => effect.destroy()
        });
    }

    attackPlayer(playerNum) {
        const attacker = playerNum === 1 ? this.player1 : this.player2;
        const defender = playerNum === 1 ? this.player2 : this.player1;
        if (this.gameOver || attacker.isAttacking) return;

        // Wojakのカウンター技
        if (attacker.charKey === 'wojak' && !attacker.isCountering) {
            this.activateCounter(attacker);
            return;
        }

        attacker.isAttacking = true;

        // Pepeの遠距離攻撃
        if (attacker.charKey === 'pepe') {
            this.fireProjectile(attacker);
            this.time.delayedCall(attacker.charData.attackCooldown, () => {
                attacker.isAttacking = false;
            });
            return;
        }

        // 攻撃エフェクト
        const attackDir = attacker.facingRight ? 1 : -1;
        const attackX = attacker.sprite.x + (attackDir * 40);
        const attackWidth = attacker.charData.attackRange === 90 ? 50 : 40; // Trollfaceは広め
        const attackHitbox = this.add.rectangle(attackX, attacker.sprite.y, attackWidth, 50, 0xff0000, 0.5);

        // 攻撃硬直
        const cooldown = attacker.charData.attackCooldown || 100;
        this.time.delayedCall(cooldown, () => {
            attackHitbox.destroy();
            attacker.isAttacking = false;
        });

        // 当たり判定
        const dx = Math.abs(attacker.sprite.x - defender.sprite.x);
        const dy = Math.abs(attacker.sprite.y - defender.sprite.y);
        const range = attacker.charData.attackRange || 70;
        const inRange = dx < range && dy < 50;

        if (inRange && !defender.invincible) {
            // Wojakのカウンター判定
            if (defender.isCountering) {
                this.triggerCounter(defender, attacker);
            } else {
                this.applyHit(attacker, defender);
            }
        }
    }

    activateCounter(player) {
        player.isCountering = true;
        player.isAttacking = true;

        // カウンター構え表示
        this.showText('COUNTER!', player.sprite.x, player.sprite.y - 50, '#f5deb3');

        // 構えエフェクト
        const counterEffect = this.add.rectangle(player.sprite.x, player.sprite.y, 70, 70)
            .setStrokeStyle(3, 0xf5deb3)
            .setFillStyle(0xf5deb3, 0.2);

        // カウンター時間終了
        player.counterTimer = this.time.delayedCall(400, () => {
            player.isCountering = false;
            player.isAttacking = false;
            counterEffect.destroy();
        });
    }

    triggerCounter(defender, attacker) {
        // カウンター成功！
        this.showText('FEEL IT!', defender.sprite.x, defender.sprite.y - 50, '#ffff00');

        // カウンターダメージ（1.5倍）
        const counterDamage = defender.charData.damage * 1.5;
        attacker.damage += counterDamage;

        // ダメージ表示更新
        if (attacker.num === 1) {
            this.p1DamageText.setText(`${Math.floor(attacker.damage)}%`);
        } else {
            this.p2DamageText.setText(`${Math.floor(attacker.damage)}%`);
        }

        // 強めのノックバック
        const knockbackDir = defender.sprite.x < attacker.sprite.x ? 1 : -1;
        attacker.sprite.body.setVelocity(knockbackDir * 500, -400);

        // カウンター終了
        if (defender.counterTimer) {
            defender.counterTimer.remove();
        }
        defender.isCountering = false;
        defender.isAttacking = false;

        this.cameras.main.shake(150, 0.02);
    }

    fireProjectile(attacker) {
        const dir = attacker.facingRight ? 1 : -1;

        // 涙弾（Pepe専用）
        const tear = this.add.ellipse(
            attacker.sprite.x + dir * 30,
            attacker.sprite.y,
            15, 20,
            0x00bfff, 0.8
        );
        this.physics.add.existing(tear);
        tear.body.setVelocityX(dir * 400);
        tear.body.setAllowGravity(false);

        tear.attackerNum = attacker.num;
        tear.damage = attacker.charData.damage;

        this.projectiles.add(tear);

        // 一定時間で消滅
        this.time.delayedCall(1500, () => {
            if (tear.active) tear.destroy();
        });

        this.showText('*sob*', attacker.sprite.x, attacker.sprite.y - 30, '#00bfff');
    }

    applyHit(attacker, defender) {
        // スーパーアーマー判定（Trollfaceが攻撃中の場合）
        const hasArmor = attacker.charData.superArmor && attacker.isAttacking;

        const damage = attacker.charData.damage;
        defender.damage += damage;

        // ダメージ表示更新
        if (defender.num === 1) {
            this.p1DamageText.setText(`${defender.damage}%`);
        } else {
            this.p2DamageText.setText(`${defender.damage}%`);
        }

        // ノックバック計算
        // ベースノックバック + ダメージ蓄積で増加
        let knockbackPower = (attacker.charData.knockback + 0.5) * (1.2 + defender.damage / 80);

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

        // ノックバック適用（スーパーアーマー時は無効にしない - 防御側のアーマー判定）
        if (!(defender.charData.superArmor && defender.isAttacking)) {
            const knockbackDir = attacker.sprite.x < defender.sprite.x ? 1 : -1;
            const knockbackX = knockbackDir * knockbackPower * 400;
            const knockbackY = -knockbackPower * 300;
            defender.sprite.body.setVelocity(knockbackX, knockbackY);
        } else {
            this.showText('ARMOR!', defender.sprite.x, defender.sprite.y - 70, '#ffffff');
        }

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

    updateCpuAI() {
        if (!this.isCpuMode || this.gameOver) return;

        const cpu = this.player2;
        const player = this.player1;
        const ai = this.cpuAI;
        const now = this.time.now;

        // 反応時間チェック
        if (now - ai.lastActionTime < ai.difficulty.reactionTime) return;
        ai.lastActionTime = now;

        // 判断精度（ランダム要素）
        if (Math.random() > ai.difficulty.accuracy) return;

        const dx = player.sprite.x - cpu.sprite.x;
        const dy = player.sprite.y - cpu.sprite.y;
        const distance = Math.abs(dx);

        // 攻撃判定
        const attackRange = cpu.charData.attackRange || 70;
        if (distance < attackRange && Math.abs(dy) < 50) {
            if (Math.random() < ai.difficulty.aggressiveness) {
                this.attackPlayer(2);
            }
        }

        // 移動判定
        if (distance > 50) {
            const moveDir = dx > 0 ? 1 : -1;
            this.movePlayer(2, moveDir);
        }

        // ジャンプ判定（プレイヤーが上にいる場合、または距離がある場合）
        if (dy < -50 || (distance > 200 && Math.random() < 0.3)) {
            this.jumpPlayer(2);
        }

        // 遠距離キャラ（Pepe）の場合は距離を保つ
        if (cpu.charKey === 'pepe' && distance < 150) {
            const retreatDir = dx > 0 ? -1 : 1;
            this.movePlayer(2, retreatDir);
        }
    }

    updateProjectiles() {
        this.projectiles.getChildren().forEach(proj => {
            if (!proj.active) return;

            const target = proj.attackerNum === 1 ? this.player2 : this.player1;
            const dx = Math.abs(proj.x - target.sprite.x);
            const dy = Math.abs(proj.y - target.sprite.y);

            if (dx < 40 && dy < 40 && !target.invincible) {
                // ヒット処理
                target.damage += proj.damage;
                if (target.num === 1) {
                    this.p1DamageText.setText(`${target.damage}%`);
                } else {
                    this.p2DamageText.setText(`${target.damage}%`);
                }

                // ノックバック（ダメージに応じて増加）
                const knockbackDir = proj.body.velocity.x > 0 ? 1 : -1;
                const projKB = 1 + target.damage / 100;
                target.sprite.body.setVelocity(knockbackDir * 300 * projKB, -200 * projKB);

                this.showText('*splash*', target.sprite.x, target.sprite.y - 30, '#00bfff');
                this.cameras.main.shake(80, 0.008);

                proj.destroy();
            }

            // 画面外で削除
            if (proj.x < -50 || proj.x > GAME_WIDTH + 50) {
                proj.destroy();
            }
        });
    }

    updateNyanCatRainbow() {
        // Nyan Catの虹エフェクト
        [this.player1, this.player2].forEach(player => {
            if (player.charKey !== 'nyancat' || !player.rainbowTrail) return;

            // 虹の軌跡を追加
            const colors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082];
            const trailPart = this.add.rectangle(
                player.sprite.x - 20,
                player.sprite.y,
                8, 40,
                colors[Math.floor(Math.random() * colors.length)],
                0.6
            );

            player.rainbowTrail.push(trailPart);

            // 古い軌跡を削除
            this.tweens.add({
                targets: trailPart,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    trailPart.destroy();
                    const idx = player.rainbowTrail.indexOf(trailPart);
                    if (idx > -1) player.rainbowTrail.splice(idx, 1);
                }
            });
        });
    }

    update() {
        if (this.gameOver) return;

        // CPU AI更新
        this.updateCpuAI();

        // 飛び道具更新
        this.updateProjectiles();

        // Nyan Cat虹エフェクト
        this.updateNyanCatRainbow();

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
                this.scene.start('VictoryScene', {
                    winner,
                    winnerChar,
                    isCpuMode: this.isCpuMode
                });
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
        player.jumpCount = 0;

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
        this.isCpuMode = data.isCpuMode || false;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // 勝者テキスト
        const winnerColor = this.winner === 1 ? '#4ecdc4' : '#ff6b6b';
        let winText = `PLAYER ${this.winner} WINS!`;
        if (this.isCpuMode) {
            winText = this.winner === 1 ? 'YOU WIN!' : 'CPU WINS!';
        }

        this.add.text(GAME_WIDTH / 2, 80, winText, {
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
    scene: [PreloadScene, TitleScene, ModeSelectScene, SelectScene, BattleScene, VictoryScene],
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
