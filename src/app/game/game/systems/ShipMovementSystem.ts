import {PhysicsBody} from "@/app/game/game/components/Position";
import {PlayerShip} from "@/app/game/game/components/Ship";
import {defineQuery, defineSystem} from "bitecs";
import {Input} from "@/app/game/game/components/Input";
import {Body} from "matter-js";

export function createShipMovementSystem(matterBodyById: Map<number, Body>) {
  const query = defineQuery([PhysicsBody, PlayerShip, Input]);
  return defineSystem(world => {
    const entities = query(world);
    for (const id of entities) {

      const body = matterBodyById.get(id);

      if (!body) {
        continue;
      }

      const isUp = !!Input.up[id];
      const isMoving = isUp;

      if (isMoving) {
        // Calculate force to apply to ship using trigonometry
        const angle = PhysicsBody.angle[id];
        const radians = angle * Math.PI / 180;
        const force = 0.002;
        const forceX = Math.cos(radians) * force;
        const forceY = Math.sin(radians) * force;
        body.force = {x: forceX, y: forceY};
      }

      const isLeft = !!Input.left[id];
      const isRight = !!Input.right[id];

      if (isLeft) {
        body.angle -= 0.1;
      } else if (isRight) {
        body.angle += 0.1;
      }
    }

    return world;
  });
}