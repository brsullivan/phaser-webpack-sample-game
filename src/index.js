import style from './app.css';

import Phaser from 'phaser';

// Images
import groundFile from './assets/images/ground.png';
import greenKeyFile from './assets/images/key_green.png';
import greenLockFile from './assets/images/lock_green.png';
import yellowKeyFile from './assets/images/key_yellow.png';
import yellowLockFile from './assets/images/lock_yellow.png';
import redKeyFile from './assets/images/key_red.png';
import redLockFile from './assets/images/lock_red.png';
import blueKeyFile from './assets/images/key_blue.png';
import blueLockFile from './assets/images/lock_blue.png';

import flyNormalFile from './assets/images/fly_normal.png';
import flyFlyFile from './assets/images/fly_fly.png';
import flyDeadFile from './assets/images/fly_dead.png';

import slimeNormalFile from './assets/images/slime_normal.png';
import slimeWalkFile from './assets/images/slime_walk.png';
import slimeDeadFile from './assets/images/slime_dead.png';

// Spritesheets 
import alienSpritesheetFile from './assets/images/character_spritesheet.png';

// Music + Sound effects
import musicSfxJsonFile from './assets/audio/music-sfx.json';
import musicSfxMp3File from './assets/audio/music-sfx.mp3';

const config = {
  type: Phaser.AUTO, 
  height: 600,
  width: 800,
  parent: 'game-container',
  scene: {
    preload: preload,
    create: create, 
    update: update
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 }
    }
  }
};

const game = new Phaser.Game(config);

var cursors;

function preload() {
  this.load.image('ground', groundFile);
  this.load.image('greenKey', greenKeyFile);
  this.load.image('greenLock', greenLockFile);
  this.load.image('yellowKey', yellowKeyFile);
  this.load.image('yellowLock', yellowLockFile);
  this.load.image('redKey', redKeyFile);
  this.load.image('redLock', redLockFile);
  this.load.image('blueKey', blueKeyFile);
  this.load.image('blueLock', blueLockFile);

  this.load.image('fly', flyNormalFile);
  this.load.image('flyFly', flyFlyFile);
  this.load.image('flyDead', flyDeadFile);

  this.load.image('slime', slimeNormalFile);
  this.load.image('slimeWalk', slimeWalkFile);
  this.load.image('slimeDead', slimeDeadFile);
  
  this.load.spritesheet('alien', alienSpritesheetFile, { frameWidth: 72, frameHeight: 98 });

  this.load.audioSprite('musicSfx', musicSfxJsonFile, musicSfxMp3File);
}

function create() {
  this.cameras.main.setViewport(0, 0, 800, 600);
  this.cameras.main.setBounds(0, 0, 1800, 600);
  this.physics.world.setBounds(0, 0, 18000, 600);

  cursors = this.input.keyboard.createCursorKeys();

  const anims = this.anims;
  this.anims.create({
    key: "player-walk", 
    frames: anims.generateFrameNumbers('alien', { start: 0, end: 10 }),
    repeat: -1
  });

  this.anims.create({
    key: 'enemy-fly',
    frames: [
      { key: 'fly', duration: 200 },
      { key: 'flyFly', duration: 200}
    ],
    repeat: -1
  });

  this.anims.create({
    key: 'enemy-slime',
    frames: [
      { key: 'slime', duration: 300 },
      { key: 'slimeWalk', duration: 400 }
    ],
    repeat: -1
  });

  this.messageText = this.add.text(300, 300, '', { fontSize: 32, color: "#ffffff" }).setScrollFactor(0).setDepth(10);
  this.sound.playAudioSprite('musicSfx', 'background-1', { loop: true });

  this.ground = this.physics.add.staticGroup();
  let platformX = 35;
  for (let i = 0; i < 38; i++) {
    this.ground.create(platformX, 565, 'ground');
    platformX += 70;
  }

  this.ground.create(600, 380, 'ground');
  this.ground.create(670, 380, 'ground');
  this.ground.create(780, 195, 'ground');
  this.ground.create(850, 195, 'ground');

  this.player = this.physics.add.sprite(300, 300, 'alien').setCollideWorldBounds(true).setDrag(300, 0).setDepth(3);
  this.cameras.main.startFollow(this.player);
  this.player.anims.play('player-walk');

  this.physics.add.collider(this.player, this.ground);

  this.keys = this.physics.add.staticGroup();
  this.keys.create(100, 320, 'greenKey');
  this.keys.children.entries[0].color = 'green';
  this.keys.create(800, 510, 'yellowKey');
  this.keys.children.entries[1].color = 'yellow';
  this.keys.create(1060, 320, 'redKey');
  this.keys.children.entries[2].color = 'red';
  this.keys.create(1605, 510, 'blueKey');
  this.keys.children.entries[3].color = 'blue';

  this.collectedKeys = [];

  this.locks = this.physics.add.staticGroup();
  this.locks.create(1280, 320, 'yellowLock').setSize(35, 35);
  this.locks.children.entries[0].color = 'yellow';
  this.locks.create(910, 120, 'greenLock').setSize(35, 35);
  this.locks.children.entries[1].color = 'green';  
  this.locks.create(1700, 490, 'redLock').setSize(35, 35);
  this.locks.children.entries[2].color = 'red';
  this.locks.create(200, 490, 'blueLock').setSize(35, 35);
  this.locks.children.entries[3].color = 'blue';

  this.physics.add.overlap(this.player, this.keys, collectKey, null, this);
  this.physics.add.overlap(this.player, this.locks, attemptUnlock, null, this);

  this.fly = this.physics.add.sprite(1040, 320, 'fly').setDepth(100);
  this.fly.body.setAllowGravity(false);
  this.fly.anims.play('enemy-fly');

  this.slime = this.physics.add.sprite(1200, 490, 'slime').setDepth(1000);
  this.slime.anims.play('enemy-slime');
  this.slime.setCollideWorldBounds(true).setBounce(1, 0);
  this.slime.setVelocityX(-200);
  this.physics.add.collider(this.ground, this.slime);
}

function update() {
  const isGrounded = this.player.body.blocked.down ? true : false;

  if (this.slime.body.velocity.x > 0) {
    this.slime.setFlipX(true);
  } else {
    this.slime.setFlipX(false);
  }

  if (cursors.left.isDown) {// player moving left
    this.player.setVelocityX(-300);
    this.player.setFlipX(true);
  } else if (cursors.right.isDown) {
    this.player.setVelocityX(300);
    this.player.setFlipX(false);
  } else if (cursors.up.isDown && isGrounded) {
    this.sound.playAudioSprite('musicSfx', 'jump');
    this.player.setVelocityY(-400);
  }
}

function collectKey(player, key) {
  this.sound.playAudioSprite('musicSfx', 'coin');
  let keyX = 480 + (75 * this.collectedKeys.length);
  this.add.image(keyX, 25, key.texture.key).setScrollFactor(0);
  key.destroy();
  this.collectedKeys.push(key);
}

function attemptUnlock(player, lock) {
  this.collectedKeys.forEach((key) => {
    if (lock.color == key.color) {
      this.sound.playAudioSprite('musicSfx', 'powerup');
      lock.destroy();
      console.log(this.locks);
    }
  });
  if (this.locks.children.entries.length <= 0) {
    this.messageText.setText('YOU WIN');
    this.scene.pause();
    setTimeout(() => {
      this.messageText.setText();
      this.scene.restart();
    }, 500);
  }
}