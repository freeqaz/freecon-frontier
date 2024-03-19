import { Schema, Context, type, MapSchema } from "@colyseus/schema";

export interface InputData {
  // left: false;
  // right: false;
  // up: false;
  // down: false;
  // tick: number;
  x: number;
  y: number;
}

export class Player extends Schema {
  @type("number") x!: number;
  @type("number") y!: number;
  // @type("number") tick!: number;

  // inputQueue: InputData[] = [];
}

export class MyRoomState extends Schema {
  @type("number") mapWidth!: number;
  @type("number") mapHeight!: number;
  @type("string") random: string = 'foobar';

  @type({ map: Player }) players = new MapSchema<Player>();
}