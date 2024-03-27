import 'phaser';
import {addComponent, addEntity, createWorld, IWorld, pipe, removeEntity,} from 'bitecs'
import {EventBus} from '../EventBus';
import {Client, Room} from "colyseus.js";
import {MyRoomState} from "@/colyseus/rooms/schema/MyRoomState";
import {PhysicsManager} from "@/app/game/game/managers/physics";
import {PhysicsBody} from "@/app/game/game/components/Position";
import {MatterSprite} from "@/app/game/game/components/MatterSprite";
import Phaser from "phaser";
import {createMatterBodySystem, createMatterPhysicsBodySyncSystem} from "@/app/game/game/systems/Matter";
import {Body} from "matter-js";
import {
    createMatterPhaserSpriteSystem,
    createPhaserBodySyncSystem
} from "@/app/game/game/systems/ClientPhaserSync";
import {createPlayerSystem} from "@/app/game/game/systems/ClientPlayerSystem";
import {createShipMovementSystem} from "@/app/game/game/systems/ShipMovementSystem";
import {ExhaustThrustEmitter, NetworkShip, PlayerShip} from "@/app/game/game/components/Ship";
import {Input} from "@/app/game/game/components/Input";
import {
    createNetworkShipNetworkSystem,
    createPlayerShipNetworkSystem,
    PlayerPositionData
} from "@/app/game/game/systems/ShipNetworkSystem";
import {delay} from "@/app/game/game/utils/delay";
import {TextureKeys} from "@/app/game/game/TextureConstants";
import {
    createDefaultThrustTextureSystem,
    createPhaserThrustSystem,
    createPlayerShipThrustSystem, createThrustEmissionSystem
} from "@/app/game/game/systems/ThrustSystem";
import {createNetworkInterpolationDebugSystem} from "@/app/game/game/systems/NetworkDebugSystem";

export class Game extends Phaser.Scene {

    private world?: IWorld;
    private pipeline?: (world: IWorld) => void
    private afterPhysicsPipeline?: (world: IWorld) => void

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private room!: Room<MyRoomState>;
    private physicsManager: PhysicsManager;
    serverPlayerNetworkData: Map<number, PlayerPositionData> = new Map();
    currentPlayer?: string;

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
        addComponent(this.world, ExhaustThrustEmitter, ship);
        addComponent(this.world, PlayerShip, ship);
        addComponent(this.world, Input, ship);

        MatterSprite.texture[ship] = 0;

        const matterBodyById = new Map<number, Body>();
        const matterSpritesById = new Map<number, Phaser.GameObjects.Sprite>();
        const sessionIdToEntityId = new Map<string, number>();
        const shipEmitterById = new Map<number, Phaser.GameObjects.Particles.ParticleEmitter>();


        // Particle effects for the ship
        // this.emitter = createEmitter(this.playerShip);

        await this.connect();

        // Colyseus code
        this.room.state.players.onAdd(async (player, sessionId) => {

            if (sessionId === this.room.sessionId) {
                this.currentPlayer = sessionId;

                // Skip the current player.
                return;
            }

            // TODO: Figure out what the race condition is with Colyseus and the rest of the game.
            // Adding this seems to fix the issue where the player is not added to the game.
            // No idea why, and that really bothers me.
            await delay(100);

            const ship = addEntity(this.world);

            sessionIdToEntityId.set(sessionId, ship);

            addComponent(this.world, PhysicsBody, ship);

            PhysicsBody.x[ship] = player.x;
            PhysicsBody.y[ship] = player.y;
            PhysicsBody.angle[ship] = player.rotation;
            PhysicsBody.velocityX[ship] = player.velocityX;
            PhysicsBody.velocityY[ship] = player.velocityY;
            PhysicsBody.angularVelocity[ship] = player.rotationVelocity;
            PhysicsBody.isStatic[ship] = 0;

            addComponent(this.world, MatterSprite, ship);

            MatterSprite.texture[ship] = 0;

            addComponent(this.world, ExhaustThrustEmitter, ship);
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
                    thrustDirection: player.thrustDirection,
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

            sessionIdToEntityId.delete(sessionId);
            removeEntity(this.world, entityId);
        });

        this.pipeline = pipe(
          createDefaultThrustTextureSystem(),
          createPhaserThrustSystem(this, matterSpritesById, shipEmitterById, TextureKeys),
          createPlayerSystem(this.cursors),
          createPlayerShipThrustSystem(),
          createShipMovementSystem(matterBodyById),
          createPlayerShipNetworkSystem(this.room, matterBodyById),
          createThrustEmissionSystem(matterSpritesById, shipEmitterById),
          createNetworkInterpolationDebugSystem(this),
        )

        this.afterPhysicsPipeline = pipe(
          createNetworkShipNetworkSystem(matterBodyById, this.serverPlayerNetworkData),
          createMatterBodySystem(this.physicsManager.world, matterBodyById),
          createMatterPhysicsBodySyncSystem(matterBodyById),
          createMatterPhaserSpriteSystem(this, matterSpritesById, TextureKeys),
          createPhaserBodySyncSystem(matterSpritesById),
        )

        //
        // // Particle effects for the ship
        // this.emitter = createEmitter(this.playerShip);

        EventBus.emit('current-scene-ready', this);
    }



    update(time: number, delta: number) {
        if (!this.world || !this.pipeline || !this.currentPlayer)
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
