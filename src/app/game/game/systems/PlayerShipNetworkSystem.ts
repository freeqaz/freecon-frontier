import {Room} from "colyseus.js";
import {MyRoomState} from "@/colyseus/rooms/schema/MyRoomState";
import {Body} from "matter-js";
import {defineQuery, defineSystem} from "bitecs";
import {PhysicsBody} from "@/app/game/game/components/Position";
import {NetworkShip, PlayerShip} from "@/app/game/game/components/Ship";
import {Input} from "@/app/game/game/components/Input";

export function createPlayerShipNetworkSystem(room: Room<MyRoomState>, matterBodyById: Map<number, Body>) {
  const query = defineQuery([PhysicsBody, PlayerShip, Input]);
  return defineSystem(world => {
    const entities = query(world);
    for (const id of entities) {
      
      const playerShip = matterBodyById.get(id);
      
      if (!playerShip) {
        continue;
      }

      room.send('position', {
        x: playerShip.position.x,
        y: playerShip.position.y,
        rotation: playerShip.angle,
        // @ts-ignore
        rotationVelocity: playerShip.angularVelocity,
        velocityX: playerShip.velocity.x,
        velocityY: playerShip.velocity.y,
        // TODO: Maybe rip out thrusting into a state variable
        thrusting: Input.up[id] ? 1 : 0,
      });
    }

    return world;
  });
}

export interface PlayerPositionData {
  x: number,
  y: number,
  rotation: number,
  rotationVelocity: number,
  velocityX: number,
  velocityY: number,
  thrusting: boolean,
  // Used to determine if the latest data has been processed.
  // If true, we will apply this data to the ship on the next update.
  dirty: boolean,
}

export function createNetworkShipNetworkSystem(
  matterBodyById: Map<number, Body>,
  serverPlayerNetworkData: Map<number, PlayerPositionData>) {
  const query = defineQuery([PhysicsBody, NetworkShip]);
  return defineSystem(world => {
    const entities = query(world);
    for (const id of entities) {

      const networkShip = matterBodyById.get(id);

      if (!networkShip) {
        continue;
      }

      const networkData = serverPlayerNetworkData.get(id);

      if (!networkData || !networkData.dirty) {
        continue;
      }

      networkData.dirty = false;
      Body.setPosition(networkShip, {x: networkData.x, y: networkData.y})
      Body.setAngle(networkShip, networkData.rotation);
      Body.setAngularVelocity(networkShip, networkData.rotationVelocity);
      networkShip.velocity.x = networkData.velocityX;
      networkShip.velocity.y = networkData.velocityY;
      // TODO: Add thrusting the bitecs data

    }

    return world;
  });
}
