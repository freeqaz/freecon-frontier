import Phaser from 'phaser'
import {defineQuery, defineSystem} from 'bitecs';

import {Input} from '../components/Input';
import {PlayerShip} from "@/app/game/game/components/Ship";

export function createPlayerSystem(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
	const query = defineQuery([PlayerShip, Input])
	return defineSystem(world => {
		const entities = query(world)
		for (let i = 0; i < entities.length; ++i)
		{
			const id = entities[i]
			// set the left, right, up, down values
			Input.left[id] = cursors.left.isDown ? 1 : 0;
			Input.right[id] = cursors.right.isDown ? 1 : 0;
			Input.down[id] = cursors.down.isDown ? 1 : 0;
			Input.up[id] = cursors.up.isDown ? 1 : 0;
		}

		return world
	})
}

