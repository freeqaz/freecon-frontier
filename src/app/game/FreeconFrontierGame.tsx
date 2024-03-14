'use client';

import {MutableRefObject, useRef, useState} from 'react';
import 'phaser';
import {PhaserGame, PhaserGameRefType} from './game/PhaserGame';
import {MainMenu} from "@/app/game/game/scenes/MainMenu";

interface SpritePosition {
  x: number;
  y: number;
}

function FreeconFrontierGame() {
  const [canMoveSprite, setCanMoveSprite] = useState(true);
  const phaserRef = useRef<typeof PhaserGame | null>(null) as MutableRefObject<PhaserGameRefType | null>;
  const [spritePosition, setSpritePosition] = useState<SpritePosition>({ x: 0, y: 0 });

  const changeScene = () => {
    const scene = phaserRef.current?.scene;
    if (scene) {
      scene.changeScene();
    }
  }

  const moveSprite = () => {
    const scene = phaserRef.current?.scene;
    // noinspection SuspiciousTypeOfGuard
    if (scene && scene instanceof MainMenu) {
      scene.moveLogo(({ x, y }: SpritePosition) => {
        setSpritePosition({ x, y });
      });
    }
  }

  const addSprite = () => {
    const scene = phaserRef.current?.scene;
    if (scene) {
      const x = Phaser.Math.Between(64, scene.scale.width - 64);
      const y = Phaser.Math.Between(64, scene.scale.height - 64);
      const star = scene.add.sprite(x, y, 'star');
      scene.add.tween({
        targets: star,
        duration: 500 + Math.random() * 1000,
        alpha: 0,
        yoyo: true,
        repeat: -1
      });
    }
  }

  const currentScene = (scene: Phaser.Scene) => {
    setCanMoveSprite(!(scene instanceof MainMenu));
  }

  const buttonClasses = `w-36 m-2 p-2 bg-black text-white border border-white cursor-pointer transition-all duration-300 ease-in-out 
                              hover:border-teal-400 hover:text-teal-400 
                              active:bg-teal-400 
                              disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300`;

  return (
    <div className="w-full h-screen overflow-hidden flex justify-center items-center bg-blue-100">
      <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
      <div>
        <div>
          <button className={buttonClasses}
                  onClick={changeScene}>
            Change Scene
          </button>
        </div>
        <div>
          <button disabled={canMoveSprite} className={buttonClasses} onClick={moveSprite}>Toggle Movement</button>
        </div>
        <div className="ml-1 mb-1">Sprite Position:
          <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
        </div>
        <div>
          <button className={buttonClasses} onClick={addSprite}>Add New Sprite</button>
        </div>
      </div>
    </div>
  )
}

export default FreeconFrontierGame