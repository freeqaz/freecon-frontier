import 'phaser';
import {
    createWorld,
    addEntity,
    addComponent,
    IWorld,
    pipe, removeEntity,
} from 'bitecs'
import { EventBus } from '../EventBus';
import { Room, Client } from "colyseus.js";
import {MyRoomState, Player} from "@/colyseus/rooms/schema/MyRoomState";
import {PhysicsManager} from "@/app/game/game/managers/physics";
import {PhysicsBody} from "@/app/game/game/components/Position";
import {MatterSprite} from "@/app/game/game/components/MatterSprite";
import Phaser from "phaser";
import {createMatterBodySystem, createMatterPhysicsBodySyncSystem} from "@/app/game/game/systems/Matter";
import {Body, Composite} from "matter-js";
import {createMatterPhaserSpriteSystem, createPhaserBodySyncSystem} from "@/app/game/game/systems/ClientPhaserSync";
import {createPlayerSystem} from "@/app/game/game/systems/ClientPlayerSystem";
import {createShipMovementSystem} from "@/app/game/game/systems/ShipMovementSystem";
import {NetworkShip, PlayerShip} from "@/app/game/game/components/Ship";
import {Input} from "@/app/game/game/components/Input";
import {
    createNetworkShipNetworkSystem,
    createPlayerShipNetworkSystem,
    PlayerPositionData
} from "@/app/game/game/systems/PlayerShipNetworkSystem";

export enum Textures {
    Ship1 = 0,
}

export const TextureKeys = [
    'ship1',
]

export class Game extends Phaser.Scene {

    private world?: IWorld;
    private pipeline?: (world: IWorld) => void
    private afterPhysicsPipeline?: (world: IWorld) => void

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private room!: Room<MyRoomState>;
    private physicsManager: PhysicsManager;
    serverPlayerNetworkData: Map<number, PlayerPositionData> = new Map();

    constructor() {
        super('Game');
        this.physicsManager = new PhysicsManager();
    }

    async connect() {
        // add connection status text
        const connectionStatusText = this.add
            .text(0, 0, "Trying to connect with the server...")
            .setStyle({ color: "#ff0000" })
            .setPadding(4)

        const client = new Client("ws://localhost:2567");

        try {
            this.room = await client.joinOrCreate("my_room", {});

            // connection successful!
            connectionStatusText.destroy();

        } catch (e) {
            // couldn't connect
            connectionStatusText.text =  "Could not connect with the server.";
        }

    }

    init() {
        this.cursors = this.input.keyboard.createCursorKeys();

        // this.matter.world.on(Phaser.Physics.Matter.Events.AFTER_UPDATE, onAfterUpdate);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            // this.matter.world.off(Phaser.Physics.Matter.Events.AFTER_UPDATE, onAfterUpdate);
            // this.physicsManager.engine.enabled = false;
        });
    }

    async create() {
        this.cameras.main.setBackgroundColor(0x000000);

        // create world
        this.world = createWorld();

        const ship = addEntity(this.world);

        addComponent(this.world, PhysicsBody, ship);

        PhysicsBody.x[ship] = 400 + Math.random() * 100;
        PhysicsBody.y[ship] = 300 + Math.random() * 100;
        PhysicsBody.angle[ship] = Math.random() * 180;
        PhysicsBody.isStatic[ship] = 0;

        addComponent(this.world, MatterSprite, ship);
        addComponent(this.world, PlayerShip, ship);
        addComponent(this.world, Input, ship);

        MatterSprite.texture[ship] = 0;

        const matterBodyById = new Map<number, Body>();
        const matterSpritesById = new Map<number, Phaser.GameObjects.Sprite>();
        const sessionIdToEntityId = new Map<string, number>();

        await this.connect();

        // Colyseus code
        this.room.state.players.onAdd((player, sessionId) => {

            if (sessionId === this.room.sessionId) {
                // Skip the current player.
                return;
            }

            const ship = addEntity(this.world);

            sessionIdToEntityId.set(sessionId, ship);

            console.log('enterEntities matter body before addComponent', ship);

            addComponent(this.world, PhysicsBody, ship);

            console.log('enterEntities matter body after addComponent', ship);

            PhysicsBody.x[ship] = player.x;
            PhysicsBody.y[ship] = player.y;
            PhysicsBody.angle[ship] = player.rotation;
            PhysicsBody.velocityX[ship] = player.velocityX;
            PhysicsBody.velocityY[ship] = player.velocityY;
            PhysicsBody.angularVelocity[ship] = player.rotationVelocity;
            PhysicsBody.isStatic[ship] = 0;

            addComponent(this.world, MatterSprite, ship);

            MatterSprite.texture[ship] = 0;

            addComponent(this.world, NetworkShip, ship);

            console.log('played joined', player, sessionId);

            // listening for server updates
            player.onChange(() => {
                // do not update local position immediately
                // we're going to LERP them during the update loop.
                this.serverPlayerNetworkData.set(ship, {
                    x: player.x,
                    y: player.y,
                    rotation: player.rotation,
                    rotationVelocity: player.rotationVelocity,
                    velocityX: player.velocityX,
                    velocityY: player.velocityY,
                    thrusting: player.thrusting,
                    dirty: true,
                });
            });
        });

        // remove local reference when entity is removed from the server
        this.room.state.players.onRemove((player, sessionId) => {
            const entityId = sessionIdToEntityId.get(sessionId);
            if (entityId === undefined) {
                return;
            }

            // TODO: Add back emitter logic
            // if (emitter) {
            //     emitter.destroy();
            // }

            sessionIdToEntityId.delete(sessionId);
            removeEntity(this.world, entityId);
        });

        // create MatterSpriteSystem
        this.pipeline = pipe(
          createPlayerSystem(this.cursors),
          createShipMovementSystem(matterBodyById),
          createPlayerShipNetworkSystem(this.room, matterBodyById)
        )

        this.afterPhysicsPipeline = pipe(
          createNetworkShipNetworkSystem(matterBodyById, this.serverPlayerNetworkData),
          createMatterBodySystem(this.physicsManager.world, matterBodyById),
          createMatterPhysicsBodySyncSystem(matterBodyById),
          createMatterPhaserSpriteSystem(this, matterSpritesById, TextureKeys),
          createPhaserBodySyncSystem(matterSpritesById)
        )

        // const createEmitter = (body?: Phaser.Physics.Arcade.Sprite | Phaser.Types.Physics.Arcade.ImageWithDynamicBody) => {
        //     return this.add.particles(0, 0, 'flares', {
        //         frame: 'white',
        //         color: [ 0xfacc22, 0xf89800, 0xf83600, 0x9f0404 ],
        //         colorEase: 'quad.out',
        //         speed: 200,
        //         scale: { start: 0.09, end: 0 },
        //         blendMode: 'ADD',
        //         lifespan: 300,
        //         emitting: false,
        //         follow: body
        //     }).setDepth(-1);
        // }
        //
        // // Particle effects for the ship
        // this.emitter = createEmitter(this.playerShip);

        EventBus.emit('current-scene-ready', this);
    }

    emitParticleFromShip(ship: Phaser.Physics.Arcade.Sprite | Phaser.Types.Physics.Arcade.ImageWithDynamicBody, emitter: Phaser.GameObjects.Particles.ParticleEmitter) {
        // @ts-ignore
        this.physics.velocityFromRotation(ship.rotation, 200, ship.body?.acceleration);

        const particle = emitter.emitParticleAt(ship.x, ship.y, 1);
        if (particle) {
            // Minimum speed of the particles. Makes it look better when thrusting against a wall, for example.
            const minParticleSpeed = 300;
            // Factor to control the speed based on the ship's speed
            const speedFactor = 1.2;
            const shipAngleInRadians = ship.rotation;

            // If the ship has a velocity, adjust the particle velocity based on it
            if (ship.body) {
                const shipSpeed = Math.sqrt(Math.pow(ship.body.velocity.x, 2) + Math.pow(ship.body.velocity.y, 2));

                // Pick either speed for the particle based on either the ship's speed or the minimum speed
                const adjustedSpeed = Math.max(minParticleSpeed, shipSpeed * speedFactor);

                // Recalculate base velocities with adjusted speed
                particle.velocityX = Math.cos(shipAngleInRadians) * adjustedSpeed * -1;
                particle.velocityY = Math.sin(shipAngleInRadians) * adjustedSpeed * -1;
            }
        }
    }

    update(time: number, delta: number) {
        if (!this.world || !this.pipeline)
        {
            return;
        }

        // Colyseus code
        // skip loop if not connected yet.
        if (!this.room) { return; }

        this.physicsManager.update(delta);

        this.afterPhysicsPipeline(this.world);

        this.pipeline(this.world);

        // // Phaser.Math.RotateAroundDistance(this.emitter, this.playerShip.x / 18, this.playerShip.y / 18, this.playerShip.rotation, 10);
        // // Update the emitter position to behind the ship based on its angle
        // // this.emitter.setPosition(this.playerShip.x / 20, this.playerShip.y / 20);
        // // @ts-ignore
        // // this.emitter.setAngle({ min: this.playerShip.angle, max: this.playerShip.angle});
        // // this.emitter.setAngle(this.playerShip.angle);
    }

    changeScene() {
        this.scene.start('GameOver');
    }
}
