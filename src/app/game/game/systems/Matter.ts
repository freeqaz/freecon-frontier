import {defineSystem, defineQuery, enterQuery, exitQuery} from 'bitecs'
import {Body, Bodies, Composite, World} from 'matter-js';

import {PhysicsBody} from '../components/Position'

export function createMatterBodySystem(matter: World, matterBodyById: Map<number, Body>) {
  const query = defineQuery([PhysicsBody])

  // create enter and exit queries
  const onQueryEnter = enterQuery(query)
  const onQueryExit = exitQuery(query)

  return defineSystem(world => {
    // create matter sprite on enter
    const enterEntities = onQueryEnter(world)
    for (let i = 0; i < enterEntities.length; ++i) {
      console.log('enterEntities matter body', enterEntities[i]);
      const id = enterEntities[i]

      const x = PhysicsBody.x[id]
      const y = PhysicsBody.y[id]
      const angle = PhysicsBody.angle[id]
      const velocityX = PhysicsBody.velocityX[id]
      const velocityY = PhysicsBody.velocityY[id]
      const angularVelocity = PhysicsBody.angularVelocity[id]
      const forceX = PhysicsBody.forceX[id]
      const forceY = PhysicsBody.forceY[id]

      const body = Bodies.circle(x, y, 10, {
        angle: angle,
        velocity: {x: velocityX, y: velocityY},
        angularVelocity: angularVelocity,
        force: {x: forceX, y: forceY},
      });

      Composite.add(matter, body);

      matterBodyById.set(
        id,
        body
      )
    }

    const exitEntities = onQueryExit(world);
    for (let i = 0; i < exitEntities.length; ++i) {
      const id = exitEntities[i]
      const body = matterBodyById.get(id)

      if (body) {
        Composite.remove(matter, body)
        matterBodyById.delete(id)
      }
    }

    return world
  })
}

export function createMatterPhysicsBodySyncSystem(matterBodyById: Map<number, Body>) {
  // create query
  const query = defineQuery([PhysicsBody])

  return defineSystem(world => {
    // sync simulated values back into components
    const entities = query(world)
    for (let i = 0; i < entities.length; ++i)
    {
      const id = entities[i]
      const body = matterBodyById.get(id)

      if (!body)
      {
        continue
      }

      // Sync bitecs back to the body state in matter
      PhysicsBody.x[id] = body.position.x;
      PhysicsBody.y[id] = body.position.y;
      PhysicsBody.angle[id] = body.angle;
      PhysicsBody.velocityX[id] = body.velocity.x;
      PhysicsBody.velocityY[id] = body.velocity.y;
      PhysicsBody.angularVelocity[id] = body.angularVelocity;
      PhysicsBody.forceX[id] = body.force.x;
      PhysicsBody.forceY[id] = body.force.y;
      PhysicsBody.isStatic[id] = body.isStatic ? 1 : 0;
      body.frictionAir = 0;
    }

    return world
  })
}
