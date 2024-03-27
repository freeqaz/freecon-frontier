import { Schema, Context, type, MapSchema } from "@colyseus/schema";
import {ShipStateData, ShipThrustDirection} from "@/common/NetworkTypeSchemas";


export class Player extends Schema implements ShipStateData {
  @type("number") x!: number;
  @type("number") y!: number;
  @type("number") rotation!: number;
  @type("number") rotationVelocity!: number;
  @type("number") velocityX!: number;
  @type("number") velocityY!: number;
  @type("number") thrustDirection: ShipThrustDirection = 0;
}

export class MyRoomState extends Schema {
  @type("number") mapWidth!: number;
  @type("number") mapHeight!: number;

  @type({ map: Player }) players = new MapSchema<Player>();
}