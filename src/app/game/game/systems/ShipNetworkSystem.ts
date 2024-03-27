import {Room} from "colyseus.js";
import {MyRoomState} from "@/colyseus/rooms/schema/MyRoomState";
import {Body} from "matter-js";
import {defineQuery, defineSystem, enterQuery} from "bitecs";
import {PhysicsBody} from "@/app/game/game/components/Position";
import {ExhaustThrustEmitter, NetworkShip, PlayerShip} from "@/app/game/game/components/Ship";
import {ShipStateData, ShipThrustDirection} from "@/common/NetworkTypeSchemas";
import {smartUpdatePosition} from "@/app/game/game/utils/lerp";
import {POSITION_UPDATES_PER_SECOND} from "@/common/NetworkConstants";

export function createPlayerShipNetworkSystem(room: Room<MyRoomState>, matterBodyById: Map<number, Body>) {
  let lastUpdateTimestamp = 0;

  const query = defineQuery([PhysicsBody, PlayerShip, ExhaustThrustEmitter]);
  return defineSystem(world => {
    const entities = query(world);
    for (const id of entities) {
      
      const playerShip = matterBodyById.get(id);
      
      if (!playerShip) {
        continue;
      }

      const now = Date.now();
      if (now - lastUpdateTimestamp < (1000 / POSITION_UPDATES_PER_SECOND)) {
        continue;
      }

      lastUpdateTimestamp = now;

      const positionUpdate: ShipStateData = {
        x: playerShip.position.x,
        y: playerShip.position.y,
        rotation: playerShip.angle,
        rotationVelocity: playerShip.angularVelocity,
        velocityX: playerShip.velocity.x,
        velocityY: playerShip.velocity.y,
        // We force the type cast here because we know the value is -1, 0, or 1.
        thrustDirection: ExhaustThrustEmitter.thrustDirection[id] as ShipThrustDirection,
      };

      room.send('position', positionUpdate);
    }

    return world;
  });
}

export interface PlayerPositionData extends ShipStateData {
  // Used to determine if the latest data has been processed.
  // If true, we will apply this data to the ship on the next update.
  dirty: boolean,
}
export function createNetworkShipNetworkSystem(
  matterBodyById: Map<number, Body>,
  serverPlayerNetworkData: Map<number, PlayerPositionData>) {
  const query = defineQuery([PhysicsBody, NetworkShip, ExhaustThrustEmitter]);

  const onQueryEnter = enterQuery(query);

  // Tolerance in degrees for rotation correction.
  const angleTolerance = 3;

  // Speed of interpolation, 0.2 equals 20% of the distance per frame.
  const interpolationFactor = 0.2;

  return defineSystem(world => {

    const enteredEntities = onQueryEnter(world);
    for (const id of enteredEntities) {
      NetworkShip.lastReceivedServerUpdateTimestamp[id] = Date.now();
      NetworkShip.lastServerPositionX[id] = PhysicsBody.x[id];
      NetworkShip.lastServerPositionY[id] = PhysicsBody.y[id];
      NetworkShip.lastServerRotation[id] = PhysicsBody.angle[id];
      NetworkShip.lastServerVelocityX[id] = PhysicsBody.velocityX[id];
      NetworkShip.lastServerVelocityY[id] = PhysicsBody.velocityY[id];
    }

    const entities = query(world);
    for (const id of entities) {

      const networkShip = matterBodyById.get(id);

      if (!networkShip) {
        continue;
      }

      const positionUpdate = serverPlayerNetworkData.get(id);

      if (!positionUpdate) {
        continue;
      }

      if (positionUpdate.dirty) {
        NetworkShip.lastReceivedServerUpdateTimestamp[id] = Date.now();
        NetworkShip.lastServerPositionX[id] = positionUpdate.x;
        NetworkShip.lastServerPositionY[id] = positionUpdate.y;
        NetworkShip.lastServerRotation[id] = positionUpdate.rotation;
        NetworkShip.lastServerVelocityX[id] = positionUpdate.velocityX;
        NetworkShip.lastServerVelocityY[id] = positionUpdate.velocityY;

        positionUpdate.dirty = false;
      }

      const {Velocity, Position} = smartUpdatePosition({
        Position: {
          x: networkShip.position.x,
          y: networkShip.position.y
        },
        Velocity: {
          x: networkShip.velocity.x,
          y: networkShip.velocity.y
        }
      }, {
        Position: {
          x: positionUpdate.x,
          y: positionUpdate.y
        },
        Velocity: {
          x: positionUpdate.velocityX,
          y: positionUpdate.velocityY
        }
      }, Date.now() - NetworkShip.lastReceivedServerUpdateTimestamp[id]);

      Body.setVelocity(networkShip, {
        x: Velocity.x,
        y: Velocity.y
      });
      Body.setPosition(networkShip, {
        x: Position.x,
        y: Position.y
      });

      // TODO: Make this code actually decent. Doesn't work super well currently.
      // Smoothly adjust angle if beyond tolerance.
      const angleDiff = positionUpdate.rotation - networkShip.angle;
      if (Math.abs(angleDiff) > angleTolerance) {
        Body.setAngle(networkShip, networkShip.angle + angleDiff * interpolationFactor);
      } else {
        // Set angular velocity directly to match the server's data.
        Body.setAngularVelocity(networkShip, positionUpdate.rotationVelocity);
      }

      ExhaustThrustEmitter.thrustDirection[id] = positionUpdate.thrustDirection;

    }

    return world;
  });
}


