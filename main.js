// デモモード判定
const DEMO_MODE = new URLSearchParams(window.location.search).get('demo') === '1';

// ゲーム定数
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 320;
const FIGHTER_WIDTH = 60;
const FIGHTER_HEIGHT = 100;

// 攻撃データ
const ATTACKS = {
    jab: {
        damage: 8,
        staminaCost: 10,
        startup: 5,      // 発生フレーム
        active: 5,       // 持続フレーム
        recovery: 10,    // 硬直フレーム
        range: 70,
        hitWidth: 40,
        hitHeight: 20,
        hitOffsetY: -40,
        guardDamage: 2,
        knockback: 5
    },
    low: {
        damage: 12,
        staminaCost: 20,
        startup: 10,
        active: 8,
        recovery: 15,
        range: 80,
        hitWidth: 50,
        hitHeight: 25,
        hitOffsetY: 20,
        guardDamage: 4,
        knockback: 3,
        slowEffect: 0.5,    // 移動速度低下率
        slowDuration: 90,   // 効果時間（フレーム）
        guardSlowEffect: 0.75,
        guardSlowDuration: 45
    },
    heavy: {
        damage: 25,
        staminaCost: 35,
        startup: 20,
        active: 8,
        recovery: 30,     // 空振り時の硬直が大きい
        range: 90,
        hitWidth: 55,
        hitHeight: 40,
        hitOffsetY: -30,
        guardDamage: 8,
        knockback: 20,
        hitRecovery: 20   // ヒット時は硬直軽減
    }
};

// ゲーム状態
let gameState = 'waiting'; // waiting, countdown, playing, ended
let gameTimer = 60;
let frameCount = 0;

// Canvas
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI要素
const playerHpBar = document.getElementById('player-hp-bar');
const playerStaminaBar = document.getElementById('player-stamina-bar');
const cpuHpBar = document.getElementById('cpu-hp-bar');
const cpuStaminaBar = document.getElementById('cpu-stamina-bar');
const timerDisplay = document.getElementById('timer');
const gameMessage = document.getElementById('game-message');
const startBtn = document.getElementById('start-btn');

// キー入力状態
const keys = {
    left: false,
    right: false,
    a: false,
    s: false,
    d: false,
    shift: false
};

// ファイター基本クラス
class Fighter {
    constructor(x, facingRight, isPlayer) {
        this.x = x;
        this.y = GROUND_Y;
        this.facingRight = facingRight;
        this.isPlayer = isPlayer;

        this.hp = 100;
        this.maxHp = 100;
        this.stamina = 100;
        this.maxStamina = 100;

        this.moveSpeed = 4;
        this.currentMoveSpeed = this.moveSpeed;
        this.slowTimer = 0;

        this.state = 'idle'; // idle, attacking, stunned, guarding
        this.currentAttack = null;
        this.attackFrame = 0;
        this.stunTimer = 0;

        this.isGuarding = false;
        this.hitThisAttack = false;

        // アニメーション用
        this.animTimer = 0;
        this.hitFlash = 0;
    }

    get width() { return FIGHTER_WIDTH; }
    get height() { return FIGHTER_HEIGHT; }

    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y - this.height / 2; }

    // 当たり判定ボックス（体）
    getHitbox() {
        return {
            x: this.x + 10,
            y: this.y - this.height,
            width: this.width - 20,
            height: this.height
        };
    }

    // 攻撃判定ボックス
    getAttackBox() {
        if (!this.currentAttack || this.state !== 'attacking') return null;

        const attack = ATTACKS[this.currentAttack];
        const startFrame = attack.startup;
        const endFrame = attack.startup + attack.active;

        if (this.attackFrame < startFrame || this.attackFrame >= endFrame) return null;

        const offsetX = this.facingRight ? this.width : -attack.hitWidth;

        return {
            x: this.x + offsetX,
            y: this.y - this.height / 2 + attack.hitOffsetY,
            width: attack.hitWidth,
            height: attack.hitHeight
        };
    }

    startAttack(attackType) {
        if (this.state !== 'idle' || this.stamina < ATTACKS[attackType].staminaCost) return false;

        this.state = 'attacking';
        this.currentAttack = attackType;
        this.attackFrame = 0;
        this.hitThisAttack = false;
        this.stamina -= ATTACKS[attackType].staminaCost;

        return true;
    }

    update(opponent) {
        this.animTimer++;

        // ヒットフラッシュ減衰
        if (this.hitFlash > 0) this.hitFlash--;

        // スロー効果処理
        if (this.slowTimer > 0) {
            this.slowTimer--;
            if (this.slowTimer === 0) {
                this.currentMoveSpeed = this.moveSpeed;
            }
        }

        // スタミナ回復
        if (this.state === 'idle' && !this.isGuarding) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 0.3);
        } else if (this.isGuarding) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 0.1);
        }

        // スタン処理
        if (this.state === 'stunned') {
            this.stunTimer--;
            if (this.stunTimer <= 0) {
                this.state = 'idle';
            }
            return;
        }

        // 攻撃処理
        if (this.state === 'attacking') {
            this.attackFrame++;
            const attack = ATTACKS[this.currentAttack];
            const totalFrames = attack.startup + attack.active +
                (this.hitThisAttack && attack.hitRecovery ? attack.hitRecovery : attack.recovery);

            if (this.attackFrame >= totalFrames) {
                this.state = 'idle';
                this.currentAttack = null;
            }
        }

        // 相手の方を向く（攻撃中以外）
        if (this.state === 'idle') {
            this.facingRight = opponent.centerX > this.centerX;
        }
    }

    move(direction) {
        if (this.state !== 'idle') return;

        const newX = this.x + direction * this.currentMoveSpeed;

        // 画面端制限
        if (newX >= 0 && newX <= CANVAS_WIDTH - this.width) {
            this.x = newX;
        }
    }

    takeDamage(damage, knockback, slowEffect, slowDuration) {
        let actualDamage = damage;
        let actualSlowEffect = slowEffect;
        let actualSlowDuration = slowDuration;

        if (this.isGuarding) {
            actualDamage = Math.max(1, Math.floor(damage * 0.3));
            if (slowEffect) {
                // ガード時はスロー効果軽減
                actualSlowEffect = slowEffect + (1 - slowEffect) * 0.5;
                actualSlowDuration = Math.floor(slowDuration * 0.5);
            }
        }

        this.hp = Math.max(0, this.hp - actualDamage);
        this.hitFlash = 10;

        // ノックバック
        const knockDir = this.facingRight ? -1 : 1;
        this.x = Math.max(0, Math.min(CANVAS_WIDTH - this.width,
            this.x + knockDir * (this.isGuarding ? knockback * 0.3 : knockback)));

        // スロー効果
        if (actualSlowEffect && actualSlowDuration) {
            this.currentMoveSpeed = this.moveSpeed * actualSlowEffect;
            this.slowTimer = actualSlowDuration;
        }

        // ガードしてなければスタン
        if (!this.isGuarding) {
            this.state = 'stunned';
            this.stunTimer = 15;
            this.currentAttack = null;
        }
    }

    draw() {
        ctx.save();

        const bodyX = this.x;
        const bodyY = this.y - this.height;

        // 影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.centerX, GROUND_Y + 5, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // ヒットフラッシュ
        let bodyColor = this.isPlayer ? '#3498db' : '#e74c3c';
        if (this.hitFlash > 0) {
            bodyColor = '#fff';
        }

        // ガード姿勢
        if (this.isGuarding) {
            ctx.globalAlpha = 0.8;
        }

        // 体
        ctx.fillStyle = bodyColor;

        // 攻撃中の姿勢変化
        let armOffsetX = 0;
        let armOffsetY = 0;
        let legOffsetY = 0;

        if (this.state === 'attacking') {
            const attack = ATTACKS[this.currentAttack];
            const progress = this.attackFrame / (attack.startup + attack.active);

            if (this.currentAttack === 'jab') {
                armOffsetX = Math.sin(progress * Math.PI) * 30;
            } else if (this.currentAttack === 'low') {
                legOffsetY = Math.sin(progress * Math.PI) * 20;
            } else if (this.currentAttack === 'heavy') {
                armOffsetX = Math.sin(progress * Math.PI) * 40;
                armOffsetY = Math.sin(progress * Math.PI) * -10;
            }
        }

        // スタン時の揺れ
        let stunShake = 0;
        if (this.state === 'stunned') {
            stunShake = Math.sin(this.animTimer * 0.5) * 3;
        }

        // 体（胴体）
        ctx.fillRect(bodyX + 15 + stunShake, bodyY + 25, 30, 45);

        // 頭
        ctx.beginPath();
        ctx.arc(this.centerX + stunShake, bodyY + 15, 15, 0, Math.PI * 2);
        ctx.fill();

        // 腕
        const armDir = this.facingRight ? 1 : -1;
        ctx.fillRect(
            this.centerX + stunShake + armDir * (15 + armOffsetX) - 5,
            bodyY + 30 + armOffsetY,
            10, 30
        );

        // 足
        ctx.fillRect(bodyX + 15 + stunShake, bodyY + 70 + legOffsetY, 12, 30);
        ctx.fillRect(bodyX + 33 + stunShake, bodyY + 70, 12, 30);

        // ガードエフェクト
        if (this.isGuarding) {
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, 45, 0, Math.PI * 2);
            ctx.stroke();
        }

        // スロー効果表示
        if (this.slowTimer > 0) {
            ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
            ctx.beginPath();
            ctx.arc(this.centerX, this.y - 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // デバッグ: 攻撃判定表示（コメントアウト可）
        // this.drawDebugHitbox();
    }

    drawDebugHitbox() {
        const attackBox = this.getAttackBox();
        if (attackBox) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(attackBox.x, attackBox.y, attackBox.width, attackBox.height);
        }

        const hitbox = this.getHitbox();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }
}

// プレイヤー
let player;
// CPU
let cpu;

// CPUのAI
class CpuAI {
    constructor(fighter) {
        this.fighter = fighter;
        this.actionCooldown = 0;
        this.thinkInterval = 15; // 思考間隔（フレーム）
    }

    update(opponent) {
        if (this.actionCooldown > 0) {
            this.actionCooldown--;
            return;
        }

        const distance = Math.abs(this.fighter.centerX - opponent.centerX);
        const staminaRatio = this.fighter.stamina / this.fighter.maxStamina;

        // スタミナが少ない場合はガード頻度アップ
        const guardChance = staminaRatio < 0.3 ? 0.4 : 0.15;

        // 相手が攻撃中ならガード
        if (opponent.state === 'attacking') {
            if (Math.random() < 0.7) {
                this.fighter.isGuarding = true;
                this.actionCooldown = 20;
                return;
            }
        } else {
            this.fighter.isGuarding = false;
        }

        // ランダムガード
        if (Math.random() < guardChance) {
            this.fighter.isGuarding = true;
            this.actionCooldown = 30;
            return;
        }

        this.fighter.isGuarding = false;

        // 距離に応じた行動
        if (distance > 150) {
            // 遠距離：接近
            this.moveToward(opponent);
            this.actionCooldown = 5;
        } else if (distance > 100) {
            // 中距離：接近しつつ攻撃チャンス待ち
            if (Math.random() < 0.6) {
                this.moveToward(opponent);
            }
            if (Math.random() < 0.2 && staminaRatio > 0.3) {
                this.chooseAttack(distance);
            }
            this.actionCooldown = 10;
        } else {
            // 近距離：攻撃メイン
            if (Math.random() < 0.5 && staminaRatio > 0.2) {
                this.chooseAttack(distance);
            } else if (Math.random() < 0.3) {
                this.moveAway(opponent);
            }
            this.actionCooldown = 15;
        }
    }

    moveToward(opponent) {
        const dir = opponent.centerX > this.fighter.centerX ? 1 : -1;
        this.fighter.move(dir);
    }

    moveAway(opponent) {
        const dir = opponent.centerX > this.fighter.centerX ? -1 : 1;
        this.fighter.move(dir);
    }

    chooseAttack(distance) {
        const rand = Math.random();

        if (distance < 80) {
            // 近距離
            if (rand < 0.4) {
                this.fighter.startAttack('jab');
            } else if (rand < 0.7) {
                this.fighter.startAttack('low');
            } else {
                this.fighter.startAttack('heavy');
            }
        } else if (distance < 100) {
            // 中距離
            if (rand < 0.3) {
                this.fighter.startAttack('jab');
            } else if (rand < 0.6) {
                this.fighter.startAttack('low');
            } else {
                this.fighter.startAttack('heavy');
            }
        }
    }
}

let cpuAI;
let playerAI; // デモモード用

// 当たり判定チェック
function checkCollision(box1, box2) {
    if (!box1 || !box2) return false;
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
}

// 攻撃判定処理
function processAttacks() {
    // プレイヤーの攻撃
    if (player.state === 'attacking' && !player.hitThisAttack) {
        const attackBox = player.getAttackBox();
        const cpuHitbox = cpu.getHitbox();

        if (checkCollision(attackBox, cpuHitbox)) {
            const attack = ATTACKS[player.currentAttack];
            cpu.takeDamage(
                cpu.isGuarding ? attack.guardDamage : attack.damage,
                attack.knockback,
                attack.slowEffect,
                attack.slowDuration
            );
            player.hitThisAttack = true;
        }
    }

    // CPUの攻撃
    if (cpu.state === 'attacking' && !cpu.hitThisAttack) {
        const attackBox = cpu.getAttackBox();
        const playerHitbox = player.getHitbox();

        if (checkCollision(attackBox, playerHitbox)) {
            const attack = ATTACKS[cpu.currentAttack];
            player.takeDamage(
                player.isGuarding ? attack.guardDamage : attack.damage,
                attack.knockback,
                attack.slowEffect,
                attack.slowDuration
            );
            cpu.hitThisAttack = true;
        }
    }
}

// UI更新
function updateUI() {
    if (!player || !cpu) return;
    playerHpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
    playerStaminaBar.style.width = `${(player.stamina / player.maxStamina) * 100}%`;
    cpuHpBar.style.width = `${(cpu.hp / cpu.maxHp) * 100}%`;
    cpuStaminaBar.style.width = `${(cpu.stamina / cpu.maxStamina) * 100}%`;
    timerDisplay.textContent = Math.ceil(gameTimer);
}

// ステージ描画
function drawStage() {
    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // リング床
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // リングライン
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH - 50, GROUND_Y);
    ctx.stroke();

    // コーナー
    ctx.fillStyle = '#3498db';
    ctx.fillRect(40, GROUND_Y - 5, 20, 10);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(CANVAS_WIDTH - 60, GROUND_Y - 5, 20, 10);
}

// 勝敗判定
function checkWinner() {
    if (player.hp <= 0) {
        return 'CPU';
    }
    if (cpu.hp <= 0) {
        return 'PLAYER';
    }
    if (gameTimer <= 0) {
        if (player.hp > cpu.hp) return 'PLAYER';
        if (cpu.hp > player.hp) return 'CPU';
        return 'DRAW';
    }
    return null;
}

// メッセージ表示
function showMessage(text) {
    gameMessage.textContent = text;
    gameMessage.classList.add('show');
}

function hideMessage() {
    gameMessage.classList.remove('show');
}

// ゲーム初期化
function initGame() {
    player = new Fighter(100, true, true);
    cpu = new Fighter(CANVAS_WIDTH - 160, false, false);
    cpuAI = new CpuAI(cpu);
    if (DEMO_MODE) {
        playerAI = new CpuAI(player);
    }
    gameTimer = 60;
    frameCount = 0;
}

// カウントダウン
async function startCountdown() {
    gameState = 'countdown';

    showMessage('3');
    await sleep(1000);
    showMessage('2');
    await sleep(1000);
    showMessage('1');
    await sleep(1000);
    showMessage('FIGHT!');
    await sleep(500);
    hideMessage();

    gameState = 'playing';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ゲーム終了
function endGame(winner) {
    gameState = 'ended';

    if (winner === 'DRAW') {
        showMessage('DRAW!');
    } else {
        showMessage(`${winner} WIN!`);
    }

    setTimeout(() => {
        startBtn.classList.remove('hidden');
    }, 2000);
}

// 入力処理
function handleInput() {
    if (gameState !== 'playing') return;

    // 移動
    if (keys.left) player.move(-1);
    if (keys.right) player.move(1);

    // ガード
    player.isGuarding = keys.shift && player.state === 'idle';

    // 攻撃（キーが押された瞬間のみ）
    if (keys.a && player.state === 'idle') {
        player.startAttack('jab');
        keys.a = false; // 連打防止
    }
    if (keys.s && player.state === 'idle') {
        player.startAttack('low');
        keys.s = false;
    }
    if (keys.d && player.state === 'idle') {
        player.startAttack('heavy');
        keys.d = false;
    }
}

// メインループ
function gameLoop() {
    if (gameState === 'playing') {
        frameCount++;

        // タイマー更新（60FPS想定）
        if (frameCount % 60 === 0) {
            gameTimer = Math.max(0, gameTimer - 1);
        }

        // 入力処理
        if (DEMO_MODE) {
            playerAI.update(cpu);
        } else {
            handleInput();
        }

        // 更新
        player.update(cpu);
        cpu.update(player);
        cpuAI.update(player);

        // 攻撃判定
        processAttacks();

        // 勝敗判定
        const winner = checkWinner();
        if (winner) {
            endGame(winner);
        }
    }

    // 描画
    drawStage();
    if (gameState !== 'waiting') {
        player.draw();
        cpu.draw();
    }

    // UI更新
    updateUI();

    requestAnimationFrame(gameLoop);
}

// イベントリスナー
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if (e.key === 'Shift') keys.shift = true;

    // デフォルト動作防止
    if (['ArrowLeft', 'ArrowRight', 'a', 's', 'd', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
    if (e.key === 'Shift') keys.shift = false;
});

startBtn.addEventListener('click', async () => {
    startBtn.classList.add('hidden');
    initGame();
    await startCountdown();
});

// ゲームループ開始
gameLoop();

// デモモードなら自動スタート
if (DEMO_MODE) {
    startBtn.click();
}
