/**
 * SpaceRoom exists alongside PlanetRoom. Each room is a separate networked game instance.
 * SpaceRoom is a room where players can fly around in space and shoot at each other.
 * There exist helper functions on this class to allow Turrets and other entities that need to know about where players
 * to function.
 */

export interface FreeconEntity {
  entityType: 'ship' | 'structure' | 'bullet' | 'missile';
  entityPositionType: 'static' | 'dynamic';
  x: number;
  y: number;
}

export interface DynamicFreeconEntity extends FreeconEntity {
  entityPositionType: 'dynamic';
  rotation: number;
  rotationVelocity: number;
  velocityX: number;
  velocityY: number;
}

export interface FreeconShip extends DynamicFreeconEntity {
  entityType: 'ship';
  entityPositionType: 'dynamic';
  thrusting: boolean;
  shipController: 'player' | 'ai' | 'network';
}

export interface FreeconPlayerShip extends FreeconShip {
  shipController: 'player';
  sessionId: string;
}

export interface FreeconPlayer {
  sessionId: string;
  name: string;
  ship?: FreeconPlayerShip;
}

export interface FreeconStructure extends FreeconEntity {
  entityType: 'structure';
  structureType: 'turret' | 'building' | 'planet';
}

export interface FreeconTurret extends FreeconStructure {
  entityType: 'structure';
  structureType: 'turret';
  entityPositionType: 'static';
  target?: FreeconEntity;
  bullets: FreeconBullet[];
  bulletType: string;
  bulletLifeTime: number;
  damage: number;
  fireRate: number;
  nextFireTime: number;
  bulletSpeed: number;
  range: number;
}

export interface FreeconBuilding extends FreeconStructure {
  entityType: 'structure';
  structureType: 'building';
  entityPositionType: 'static';
}

export interface FreeconProjectile extends DynamicFreeconEntity {
  entityType: 'bullet' | 'missile';
  entityPositionType: 'dynamic';
  originator: FreeconEntity;
  target?: FreeconShip;
}

export interface FreeconBullet extends FreeconProjectile {
  entityType: 'bullet';
  entityPositionType: 'dynamic';
  originator: FreeconEntity;
  target?: FreeconShip;
  damage: number;
  bulletSpeed: number;
  bulletType: 'laser';
  lifeTime: number;
  elapsedLifeTime: number;
}

export interface FreeconEntityManager {
  ships: FreeconShip[];
  structures: FreeconStructure[];
  projectiles: FreeconProjectile[];
  getAllEntities(): FreeconEntity[];
  update(time: number, delta: number): void;
}

export interface FreeconGameRoom {
  players: FreeconPlayer[];
  roomId: string;
  update: (time: number, delta: number) => void;
}

export interface FreeconDynamicGameRoom extends FreeconGameRoom {
  entities: FreeconEntityManager;
  update: (time: number, delta: number) => void;
}

export class SpaceRoom implements FreeconGameRoom {
  entities: FreeconEntityManager;
  players: FreeconPlayer[];
  roomId: string;

  constructor(roomId: string) {
    // TODO: Split into it's own class when it gets too big
    this.entities = {
      ships: [],
      structures: [],
      projectiles: [],
      getAllEntities: () => {
        return [
          ...this.entities.ships,
          ...this.entities.structures,
          ...this.entities.projectiles,
        ];
      },
      update: (time: number, delta: number) => {
        this.entities.ships.forEach((ship) => {

        });

        this.entities.projectiles.forEach((projectile) => {
          if (projectile.entityPositionType === 'dynamic') {
            projectile.x += projectile.velocityX * delta;
            projectile.y += projectile.velocityY * delta;
          }
        });
      },
    };
    this.players = [];
    this.roomId = roomId;
  }

  update(time: number, delta: number) {
    this.entities.update(time, delta);
  }
}
