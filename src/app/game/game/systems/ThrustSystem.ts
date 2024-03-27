import {defineQuery, defineSystem, enterQuery, exitQuery} from "bitecs";
import {ExhaustThrustEmitter, PlayerShip} from "@/app/game/game/components/Ship";
import {Textures} from "@/app/game/game/TextureConstants";
import {Input} from "@/app/game/game/components/Input";
import Phaser from "phaser";
import {PhysicsBody} from "@/app/game/game/components/Position";
import {MatterSprite} from "@/app/game/game/components/MatterSprite";

/**
 * This may be a bit weird and something we shy away from long-term, but for now we will set the default thrust texture
 * for all Thrust Emitters to make code a bit easier to reason about.
 * (The current failure mode would be using a ship sprite as the thrust texture lol)
 */
export function createDefaultThrustTextureSystem() {
  const query = defineQuery([ExhaustThrustEmitter]);

  const onQueryEnter = enterQuery(query)

  return defineSystem(world => {

    const enterEntities = onQueryEnter(world)
    for (let i = 0; i < enterEntities.length; ++i) {
      const id = enterEntities[i];

      if (ExhaustThrustEmitter.thrustTexture[id] !== 0) {
        continue;
      }

      ExhaustThrustEmitter.thrustTexture[id] = Textures.ShipFlares;
    }

    return world;
  })
}

export function createPlayerShipThrustSystem() {
  const query = defineQuery([PlayerShip, Input, ExhaustThrustEmitter]);
  return defineSystem(world => {
    const entities = query(world);
    for (let i = 0; i < entities.length; ++i) {
      const id = entities[i];

      if (Input.up[id]) {
        ExhaustThrustEmitter.thrustDirection[id] = 1;
      } else if (Input.down[id]) {
        ExhaustThrustEmitter.thrustDirection[id] = -1;
      } else {
        ExhaustThrustEmitter.thrustDirection[id] = 0;
      }
    }
    return world;
  })
}

// TODO: Setup configuration of the thrust values somehow. For now everything thrusts like a ship, hehe.
const createEmitter = (
  scene: Phaser.Scene,
  body: Phaser.GameObjects.Sprite,
  texture: string
) => {
  return scene.add.particles(0, 0, texture, {
    frame: 'white',
    color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
    colorEase: 'quad.out',
    speed: 200,
    scale: {start: 0.09, end: 0},
    blendMode: 'ADD',
    lifespan: 300,
    emitting: false,
    follow: body
  }).setDepth(-1);
}

export function createPhaserThrustSystem(
  scene: Phaser.Scene,
  matterSpritesById: Map<number, Phaser.GameObjects.Sprite>,
  exhaustEmittersById: Map<number, Phaser.GameObjects.Particles.ParticleEmitter>,
  textures: string[]
) {
  const query = defineQuery([PhysicsBody, MatterSprite, ExhaustThrustEmitter])

  // create enter and exit queries
  const onQueryEnter = enterQuery(query)
  const onQueryExit = exitQuery(query)

  return defineSystem(world => {
    // create matter sprite on enter
    const enterEntities = onQueryEnter(world)
    for (let i = 0; i < enterEntities.length; ++i) {
      const id = enterEntities[i];

      const textureId = ExhaustThrustEmitter.thrustTexture[id];

      const sprite = matterSpritesById.get(id);

      if (!sprite)
      {
        console.error('No sprite found for id when creating exhaust emitter', id);
        continue;
      }

      const emitter = createEmitter(scene, sprite, textures[textureId]);

      exhaustEmittersById.set(
        id,
        emitter
      );
    }

    const exitEntities = onQueryExit(world);
    for (let i = 0; i < exitEntities.length; ++i) {
      const id = exitEntities[i]
      const emitter = exhaustEmittersById.get(id)

      if (emitter) {
        emitter.destroy();
        exhaustEmittersById.delete(id)
      }
    }

    return world
  })
}

function createThrustEmissionForSprite(
  x: number,
  y: number,
  angleInRadians: number,
  velocityX: number,
  velocityY: number,
  emitter: Phaser.GameObjects.Particles.ParticleEmitter
) {

  const particle = emitter.emitParticleAt(x, y, 1);
  if (particle) {
    // Minimum speed of the particles. Makes it look better when thrusting against a wall, for example.
    const minParticleSpeed = 300;

    // Factor to control the speed based on the ship's speed
    const speedFactor = 1.2;

    const shipSpeed = Math.sqrt(Math.pow(velocityX, 2) + Math.pow(velocityY, 2));

    // Pick either speed for the particle based on either the ship's speed or the minimum speed
    const adjustedSpeed = Math.max(minParticleSpeed, shipSpeed * speedFactor);

    // Recalculate base velocities with adjusted speed
    particle.velocityX = Math.cos(angleInRadians) * adjustedSpeed * -1;
    particle.velocityY = Math.sin(angleInRadians) * adjustedSpeed * -1;
  }
}

export function createThrustEmissionSystem(
  matterSpritesById: Map<number, Phaser.GameObjects.Sprite>,
  exhaustEmittersById: Map<number, Phaser.GameObjects.Particles.ParticleEmitter>
) {
  // create query
  const query = defineQuery([PhysicsBody, MatterSprite, ExhaustThrustEmitter])

  return defineSystem(world => {
    // sync simulated values back into components
    const entities = query(world)
    for (let i = 0; i < entities.length; ++i)
    {
      const id = entities[i];

      const x = PhysicsBody.x[id];
      const y = PhysicsBody.y[id];
      const angle = PhysicsBody.angle[id];
      const angleInRadians = angle * Math.PI / 180;
      const velocityX = PhysicsBody.velocityX[id];
      const velocityY = PhysicsBody.velocityY[id];
      const thrustDirection = ExhaustThrustEmitter.thrustDirection[id];

      const sprite = matterSpritesById.get(id);

      if (!sprite)
      {
        console.log('No sprite found for thrust emission with id', id);
        continue;
      }

      const emitter = exhaustEmittersById.get(id);

      if (!emitter)
      {
        console.log('No emitter found for thrust emission with id', id);
        continue;
      }

      if (thrustDirection === 1) {
        createThrustEmissionForSprite(
          x,
          y,
          angleInRadians,
          velocityX,
          velocityY,
          emitter
        );
      } else if (thrustDirection === -1) {

        createThrustEmissionForSprite(
          x,
          y,
          angleInRadians + Math.PI,
          velocityX,
          velocityY,
          emitter
        );
      }
    }

    return world
  })
}