import * as Colyseus from "colyseus";
console.log(Colyseus);
import { Room, Client } from "colyseus";
import { InputData, MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  fixedTimeStep = 1000 / 60;

  onCreate (options: any) {
    this.setState(new MyRoomState());

    // set map dimensions
    this.state.mapWidth = 800;
    this.state.mapHeight = 600;

    this.onMessage<InputData>('position', (client, input) => {

      // handle player input
      const player = this.state.players.get(client.sessionId);

      if (!player) {
        return;
      }

      player.x = input.x;
      player.y = input.y;
      player.velocityX = input.velocityX;
      player.velocityY = input.velocityY;
      player.rotation = input.rotation;
      player.rotationVelocity = input.rotationVelocity;
      player.thrusting = input.thrusting;
    });

    this.setSimulationInterval((deltaTime) => {
    //   this.update(deltaTime);
    });
  }

  // update(deltaTime: number) {
  //   const velocity = 2;

  //   this.state.players.forEach(player => {
  //     let input: InputData | undefined;

  //     // dequeue player inputs
  //     while (input = player.inputQueue.shift()) {
  //       if (input.left) {
  //         player.x -= velocity;

  //       } else if (input.right) {
  //         player.x += velocity;
  //       }

  //       if (input.up) {
  //         player.y -= velocity;

  //       } else if (input.down) {
  //         player.y += velocity;
  //       }

  //       player.tick = input.tick;
  //     }
  //   });
  // }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new Player();
    player.x = Math.random() * this.state.mapWidth;
    player.y = Math.random() * this.state.mapHeight;

    this.state.players.set(client.sessionId, player);
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
