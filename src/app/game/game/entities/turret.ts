import {
  FreeconBullet, FreeconDynamicGameRoom,
  FreeconShip,
  FreeconTurret
} from "@/app/game/game/entities/SpaceRoom";

export interface TurretConfig {
  scene: Phaser.Scene;
  gameRoom: FreeconDynamicGameRoom;
  x: number;
  y: number;
  texture: string;
  frame?: string;
  turretParams: Partial<FreeconTurret>;
}

export const DefaultLaserTurretParams: Partial<FreeconTurret> = {
  damage: 10,
  bulletSpeed: 1000,
  bulletLifeTime: 10000,
  fireRate: 100,
  range: 300,
  bulletType: 'laser'
};

export function calculateVelocityWithSpeedAndRotation(speed: number, rotation: number) {
  return {
    x: speed * Math.cos(rotation),
    y: speed * Math.sin(rotation)
  }
}

export class Turret extends Phaser.GameObjects.Sprite implements FreeconTurret {
  gameRoom: FreeconDynamicGameRoom;

  target?: FreeconShip;
  bullets: FreeconBullet[];

  entityType: "structure";
  structureType: "turret";
  entityPositionType: "static";

  bulletType: string;
  bulletLifeTime: number;
  damage: number;
  fireRate: number;
  nextFireTime: number;
  bulletSpeed: number;
  range: number;

  constructor({ scene, gameRoom, x, y, texture, frame, turretParams }: TurretConfig) {
    super(scene, x, y, texture, frame);
    this.scene = scene;
    this.gameRoom = gameRoom;
    this.target = null;
    this.bullets = [];

    const currentTurretParams = { ...DefaultLaserTurretParams, ...turretParams };
    this.damage = currentTurretParams.damage;
    this.bulletSpeed = currentTurretParams.bulletSpeed;

    this.fireRate = currentTurretParams.fireRate;
    this.range = currentTurretParams.range;
    this.bulletType = currentTurretParams.bulletType;
    this.bulletLifeTime = currentTurretParams.bulletLifeTime;
    this.nextFireTime = 0;

    this.scene.add.existing(this);
  }

  update(time: number, delta: number) {
    this.calculateTarget();
    if (this.target) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
      this.rotation = angle;
      if (time > this.nextFireTime) {
        this.fire();
        this.nextFireTime = time + this.fireRate;
      }
    }
  }

  calculateTarget() {
    // TODO: Implement logic to fire at only enemies, and other entities too.
    const enemies = this.gameRoom.entities.ships;

    // Calculate closest enemy
    const closestEnemy = enemies.reduce((closest, enemy) => {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      return distance < closest.distance ? { enemy, distance } : closest;
    }, {enemy: undefined, distance: this.range}).enemy;

    this.target = closestEnemy;
  }

  fire() {
    // TODO: Clean up this logic to be reusable. Maybe a bullet factory/helper?
    const velocity = calculateVelocityWithSpeedAndRotation(this.bulletSpeed, this.rotation);
    const bullet: FreeconBullet = {
      bulletSpeed: this.bulletSpeed,
      damage: this.damage,
      entityType: 'bullet',
      entityPositionType: 'dynamic',
      originator: this,
      target: this.target,
      bulletType: 'laser',
      lifeTime: this.bulletLifeTime,
      elapsedLifeTime: 0,
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      rotationVelocity: 0,
      velocityX: velocity.x,
      velocityY: velocity.y
    }

    if (bullet) {
      // TODO: Implement a bullet firing method. Probably for animations and stuff. Maybe the event bus for abstraction? Or is that hell?
      // bullet.fire(this.target, this.damage, this.bulletSpeed);
      this.bullets.push(bullet);
      this.gameRoom.entities.projectiles.push(bullet);
    }
  }
}
