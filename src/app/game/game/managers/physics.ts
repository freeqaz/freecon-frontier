import matterjs from 'matter-js';

export class PhysicsManager {
  engine: matterjs.Engine;
  world: matterjs.World;

  constructor() {
    this.engine = matterjs.Engine.create({
      gravity: {
        x: 0,
        y: 0
      }
    });
    this.world = this.engine.world;
  }

  update(delta: number) {
    matterjs.Engine.update(this.engine, delta);
  }
}
