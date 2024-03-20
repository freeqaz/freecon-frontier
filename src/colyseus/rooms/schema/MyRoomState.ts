import { Schema, Context, type, MapSchema } from "@colyseus/schema";

export interface InputData {
  x: number;
  y: number;
  rotation: number;
  rotationVelocity: number;
  velocityX: number;
  velocityY: number;
  thrusting: boolean;
}

export class Player extends Schema {
  @type("number") x!: number;
  @type("number") y!: number;
  @type("number") rotation!: number;
  @type("number") rotationVelocity!: number;
  @type("number") velocityX!: number;
  @type("number") velocityY!: number;
  @type("boolean") thrusting: boolean = false;
}

export class MyRoomState extends Schema {
  @type("number") mapWidth!: number;
  @type("number") mapHeight!: number;

  @type({ map: Player }) players = new MapSchema<Player>();
}