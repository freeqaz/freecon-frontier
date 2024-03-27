import {PhysicsBody} from "@/app/game/game/components/Position";
import {PlayerShip} from "@/app/game/game/components/Ship";
import {defineQuery, defineSystem} from "bitecs";
import {Input} from "@/app/game/game/components/Input";
import {Body} from "matter-js";

export function createShipMovementSystem(
  matterBodyById: Map<number, Body>
) {
  const query = defineQuery([PhysicsBody, PlayerShip, Input]);
  return defineSystem(world => {
    const entities = query(world);
    for (const id of entities) {

      const body = matterBodyById.get(id);

      if (!body) {
        continue;
      }

      const isUp = !!Input.up[id];
      const isDown = !!Input.down[id]; // Check if the back arrow is pressed
      const isMoving = isUp || isDown;

      if (isMoving) {
        // Calculate force to apply to ship using trigonometry
        const angle = PhysicsBody.angle[id];
        const radians = angle * Math.PI / 180;
        const force = 0.0002 * (isUp ? 1 : -1); // Negate force if moving backwards
        const forceX = Math.cos(radians) * force;
        const forceY = Math.sin(radians) * force;
        body.force = {x: forceX, y: forceY};
      }

      // Limit maximum velocity
      const MAX_LINEAR_VELOCITY = 4;
      const velocity = body.velocity;
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      if (speed > MAX_LINEAR_VELOCITY) {
        const scale = MAX_LINEAR_VELOCITY / speed;
        Body.setVelocity(body, {
          x: velocity.x * scale,
          y: velocity.y * scale
        })
      }


      const isLeft = !!Input.left[id];
      const isRight = !!Input.right[id];

      if (isLeft) {
        body.angle -= 0.1;

      } else if (isRight) {
        body.angle += 0.1;
      } else {
        const epsilon = 1e-8;
        const base = 2; // Base for the logarithmic scale, can adjust for different curves
        const cutoffThreshold = 0.25; // Adjust this to control when the tapering effect starts
        const minThreshold = 0.1; // Velocity below which is set to 0
        const initialReductionFactor = 0.7; // Starting point for reduction, adjust for quicker/slower initial deceleration

        let angularVelocity = body.angularVelocity;

        // Check if angular velocity is above the minimum threshold for adjustment
        if (Math.abs(angularVelocity) > cutoffThreshold) {
          const sign = Math.sign(angularVelocity);
          // Calculate the adjusted magnitude based on the logarithmic scale
          let adjustedMagnitude = sign * Math.log(Math.abs(angularVelocity) + epsilon) / Math.log(base);
          // Dynamic reduction factor: scales down as the velocity decreases
          let dynamicReductionFactor = initialReductionFactor * Math.exp(-Math.abs(angularVelocity - cutoffThreshold));
          // Apply the adjusted magnitude with the dynamic reduction factor
          angularVelocity = adjustedMagnitude * dynamicReductionFactor;
          Body.setAngularVelocity(body, angularVelocity);
        } else if (Math.abs(angularVelocity) < minThreshold) {
          // If the velocity is below the minimum threshold, cut it off
          Body.setAngularVelocity(body, 0);
        }
      }

      // Limit angular velocity
      const VELOCITY = 4.5;
      if (body.angularVelocity > VELOCITY) {
        Body.setAngularVelocity(body, VELOCITY);
      } else if (body.angularVelocity < -VELOCITY) {
        Body.setAngularVelocity(body, -VELOCITY);
      }
    }

    return world;
  });
}
