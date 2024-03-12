import 'phaser';
import {forwardRef, MutableRefObject, useEffect, useLayoutEffect, useRef} from 'react';
import StartGame from './main.js';
import { EventBus } from './EventBus.js';

interface PhaserGameProps {
    currentActiveScene: (scene: Phaser.Scene) => void;
}

export interface PhaserGameRef {
    game: Phaser.Game;
    scene: (Phaser.Scene & {changeScene(): void}) | null;
}

export type PhaserGameRefType = Phaser.Game & PhaserGameRef;

export const PhaserGame = forwardRef<PhaserGameRefType, PhaserGameProps>(function PhaserGame ({ currentActiveScene }, ref)
{
    const game = useRef<Phaser.Game>();

    // Create the game inside a useLayoutEffect hook to avoid the game being created outside the DOM
    useLayoutEffect(() => {

        if (game.current === undefined)
        {
            game.current = StartGame("game-container");

            if (ref !== null)
            {
                (ref as MutableRefObject<Phaser.Game | null>).current = {
                    game: game.current,
                    // This seems fine. It works, so maybe the Phaser types are wrong?
                    // @ts-ignore
                    scene: null
                };
            }
        }

        return () => {

            if (game.current)
            {
                game.current.destroy(true);
                game.current = undefined;
            }

        }
    }, [ref]);

    useEffect(() => {

        EventBus.on('current-scene-ready', (currentScene: Phaser.Scene) => {

            currentActiveScene(currentScene);
            const sceneRef = ref as MutableRefObject<Phaser.Game | null>;
            if (sceneRef.current) {
                // TODO: Figure out why this isn't compatible with the SceneManager type.
                // @ts-ignore
                sceneRef.current.scene = currentScene;
            }

        });

        return () => {

            EventBus.removeListener('current-scene-ready');

        }

    }, [currentActiveScene, ref])

    return (
        <div id="game-container"></div>
    );

});