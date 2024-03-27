import {defineQuery, defineSystem, enterQuery, exitQuery} from "bitecs";
import {PhysicsBody} from "@/app/game/game/components/Position";
import {MatterSprite} from "@/app/game/game/components/MatterSprite";
import Phaser from "phaser";


export function createMatterPhaserSpriteSystem(
  scene: Phaser.Scene,
  matterSpritesById: Map<number, Phaser.GameObjects.Sprite>,
  textures: string[]
) {
  const query = defineQuery([PhysicsBody, MatterSprite])

  // create enter and exit queries
  const onQueryEnter = enterQuery(query)
  const onQueryExit = exitQuery(query)

  return defineSystem(world => {
    // create matter sprite on enter
    const enterEntities = onQueryEnter(world)
    for (let i = 0; i < enterEntities.length; ++i) {
      const id = enterEntities[i];

      const x = PhysicsBody.x[id];
      const y = PhysicsBody.y[id];
      const angle = PhysicsBody.angle[id];
      const textureId = MatterSprite.texture[id];

      const sprite = scene.add.sprite(x, y, textures[textureId]);
      sprite.angle = angle;

      matterSpritesById.set(id,
        sprite
      );
    }

    const exitEntities = onQueryExit(world);
    for (let i = 0; i < exitEntities.length; ++i) {
      const id = exitEntities[i]
      const sprite = matterSpritesById.get(id)

      if (sprite) {
        sprite.destroy();
        matterSpritesById.delete(id)
      }
    }

    return world
  })
}


export function createPhaserBodySyncSystem(matterSpritesById: Map<number, Phaser.GameObjects.Sprite>) {
  // create query
  const query = defineQuery([PhysicsBody, MatterSprite])

  return defineSystem(world => {
    // sync simulated values back into components
    const entities = query(world)
    for (let i = 0; i < entities.length; ++i)
    {
      const id = entities[i]
      const sprite = matterSpritesById.get(id)

      if (!sprite)
      {
        console.log('No sprite found for id', id);
        continue;
      }

      sprite.x = PhysicsBody.x[id]
      sprite.y = PhysicsBody.y[id]
      sprite.angle = PhysicsBody.angle[id]
    }

    return world
  })
}
