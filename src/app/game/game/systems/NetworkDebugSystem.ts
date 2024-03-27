import Phaser from "phaser";
import {defineQuery, defineSystem, enterQuery, exitQuery} from "bitecs";
import {MatterSprite} from "@/app/game/game/components/MatterSprite";
import {PhysicsBody} from "@/app/game/game/components/Position";
import {NetworkShip} from "@/app/game/game/components/Ship";
import {Vector} from "matter-js";

export function createNetworkInterpolationDebugSystem(
  scene: Phaser.Scene,
) {
  const debugShapes = new Map<number, {
    futurePosition500ms: Phaser.GameObjects.Shape,
    futurePosition1000ms: Phaser.GameObjects.Shape,
    futurePosition2000ms: Phaser.GameObjects.Shape,
    currentPosition500ms: Phaser.GameObjects.Shape,
    currentPosition1000ms: Phaser.GameObjects.Shape,
    currentPosition2000ms: Phaser.GameObjects.Shape,
    lastServerPosition: Phaser.GameObjects.Shape,
  }>();

  const query = defineQuery([PhysicsBody, NetworkShip]);

  const onEnter = enterQuery(query);
  const onExit = exitQuery(query);

  return defineSystem(world => {

    const onEnterEntities = onEnter(world);
    for (let i = 0; i < onEnterEntities.length; ++i) {
      const id = onEnterEntities[i];

      const futurePositionX = NetworkShip.lastServerPositionX[id];
      const futurePositionY = NetworkShip.lastServerPositionY[id];

      const futurePosition500ms = scene.add.circle(futurePositionX, futurePositionY, 2, 0xff0000, 0.5);
      const futurePosition1000ms = scene.add.circle(futurePositionX, futurePositionY, 3, 0xff0055, 0.5);
      const futurePosition2000ms = scene.add.circle(futurePositionX, futurePositionY, 4, 0xff0055, 0.5);
      const currentPosition500ms = scene.add.circle(futurePositionX, futurePositionY, 2, 0x0000ff, 0.5);
      const currentPosition1000ms = scene.add.circle(futurePositionX, futurePositionY, 3, 0x0000ff, 0.5);
      const currentPosition2000ms = scene.add.circle(futurePositionX, futurePositionY, 4, 0x0000ff, 0.5);
      const lastServerPosition = scene.add.circle(NetworkShip.lastServerPositionX[id], NetworkShip.lastServerPositionY[id], 2, 0x00ff00, 0.5);
      debugShapes.set(id, {
        futurePosition500ms: futurePosition500ms,
        futurePosition1000ms: futurePosition1000ms,
        futurePosition2000ms: futurePosition2000ms,
        currentPosition500ms: currentPosition500ms,
        currentPosition1000ms: currentPosition1000ms,
        currentPosition2000ms: currentPosition2000ms,
        lastServerPosition: lastServerPosition,
      });
    }

    const onExitEntities = onExit(world);
    for (let i = 0; i < onExitEntities.length; ++i) {
      const id = onExitEntities[i];

      const debugShape = debugShapes.get(id);
      if (debugShape) {
        debugShape.futurePosition500ms.destroy();
        debugShape.futurePosition1000ms.destroy();
        debugShape.futurePosition2000ms.destroy();
        debugShape.currentPosition500ms.destroy();
        debugShape.currentPosition1000ms.destroy();
        debugShape.currentPosition2000ms.destroy();
        debugShape.lastServerPosition.destroy();
        debugShapes.delete(id);
      }
    }

    const entities = query(world);
    for (let i = 0; i < entities.length; ++i) {
      const id = entities[i];

      const lastServerPositionX = NetworkShip.lastServerPositionX[id];
      const lastServerPositionY = NetworkShip.lastServerPositionY[id];
      const lastServerVelocityX = NetworkShip.lastServerVelocityX[id];
      const lastServerVelocityY = NetworkShip.lastServerVelocityY[id];

      const currentX = PhysicsBody.x[id];
      const currentY = PhysicsBody.y[id];
      const currentVelocityX = PhysicsBody.velocityX[id];
      const currentVelocityY = PhysicsBody.velocityY[id];

      function offsetPositionByDistanceAndAngle(x: number, y: number, distance: number, angle: number) {
        return {
          x: x + distance * Math.cos(angle),
          y: y + distance * Math.sin(angle),
        };
      }

      // Extrapolate future position of the ship based on current velocity.
      function calculateFuturePosition(timeMs: number, x: number, y: number, angle: number, offset: number) {
        const perpendicularAngle = angle + Math.PI / 2;
        const positionWithOffset = offsetPositionByDistanceAndAngle(
          x,
          y,
          offset,
          perpendicularAngle
        );

        const currentSpeed = Vector.magnitude({x: currentVelocityX, y: currentVelocityY});

        const futurePosition = offsetPositionByDistanceAndAngle(
          0,
          0,
          currentSpeed * (timeMs / 1000) * 60,
          angle
        );

        return {
          x: positionWithOffset.x + futurePosition.x,
          y: positionWithOffset.y + futurePosition.y,
        };
      }

      let debugShape = debugShapes.get(id);

      if (!debugShape) {
        continue;
      }

      const serverVelocityAngle = Math.atan2(lastServerVelocityY, lastServerVelocityX);

      const serverPosition500ms = calculateFuturePosition(500, lastServerPositionX, lastServerPositionY, serverVelocityAngle, 0);
      const serverPosition1000ms = calculateFuturePosition(1000, lastServerPositionX, lastServerPositionY, serverVelocityAngle, 0);
      const serverPosition2000ms = calculateFuturePosition(2000, lastServerPositionX, lastServerPositionY, serverVelocityAngle, 0);

      const currentVelocityAngle = Math.atan2(currentVelocityY, currentVelocityX);

      const position500ms = calculateFuturePosition(0, currentX, currentY, currentVelocityAngle, 0);
      const position1000ms = calculateFuturePosition(500, currentX, currentY, currentVelocityAngle, 0);
      const position2000ms = calculateFuturePosition(1000, currentX, currentY, currentVelocityAngle, 0);

      const {
        futurePosition500ms,
        futurePosition1000ms,
        futurePosition2000ms,
        currentPosition500ms,
        currentPosition1000ms,
        currentPosition2000ms,
        lastServerPosition
      } = debugShape;
      futurePosition500ms.setPosition(serverPosition500ms.x, serverPosition500ms.y);
      futurePosition1000ms.setPosition(serverPosition1000ms.x, serverPosition1000ms.y);
      futurePosition2000ms.setPosition(serverPosition2000ms.x, serverPosition2000ms.y);
      currentPosition500ms.setPosition(position500ms.x, position500ms.y);
      currentPosition1000ms.setPosition(position1000ms.x, position1000ms.y);
      currentPosition2000ms.setPosition(position2000ms.x, position2000ms.y);
      lastServerPosition.setPosition(lastServerPositionX, lastServerPositionY);
    }
    return world;
  })
}
