import 'phaser';
import {
    createWorld,
    addEntity,
    addComponent,
    IWorld,
    pipe,
} from 'bitecs'
import { EventBus } from '../EventBus';
import { Room, Client } from "colyseus.js";
import {MyRoomState, Player} from "@/colyseus/rooms/schema/MyRoomState";
import {PhysicsManager} from "@/app/game/game/managers/physics";
import {PhysicsBody} from "@/app/game/game/components/Position";
import {MatterSprite} from "@/app/game/game/components/MatterSprite";
import Phaser from "phaser";
import {createMatterBodySystem, createMatterPhysicsBodySyncSystem} from "@/app/game/game/systems/Matter";
import {Body} from "matter-js";
import {createMatterPhaserSpriteSystem, createPhaserBodySyncSystem} from "@/app/game/game/systems/ClientPhaserSync";
import {createPlayerSystem} from "@/app/game/game/systems/ClientPlayerSystem";
import {createShipMovementSystem} from "@/app/game/game/systems/ShipMovementSystem";
import {PlayerShip} from "@/app/game/game/components/Ship";
import {Input} from "@/app/game/game/components/Input";

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

    private playerShip!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    playerEntities: { [sessionId: string]: {
        body: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
        emitter: Phaser.GameObjects.Particles.ParticleEmitter
    } } = {};
    private room!: Room<MyRoomState>;
    private physicsManager: PhysicsManager;

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

        // const onAfterUpdate = () => {
        //     if (!this.afterPhysicsPipeline || !this.world)
        //     {
        //         return;
        //     }
        //
        //     this.afterPhysicsPipeline(this.world);
        // }

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

        PhysicsBody.x[ship] = 400;
        PhysicsBody.y[ship] = 300;
        PhysicsBody.angle[ship] = 76;
        PhysicsBody.isStatic[ship] = 0;

        addComponent(this.world, MatterSprite, ship);
        addComponent(this.world, PlayerShip, ship);
        addComponent(this.world, Input, ship);

        MatterSprite.texture[ship] = 0;

        const matterBodyById = new Map<number, Body>();
        const matterSpritesById = new Map<number, Phaser.GameObjects.Sprite>();

        // create MatterSpriteSystem
        this.pipeline = pipe(
          createMatterBodySystem(this.physicsManager.world, matterBodyById),
          createMatterPhaserSpriteSystem(this, matterSpritesById, TextureKeys),
          createPlayerSystem(this.cursors),
          createShipMovementSystem(matterBodyById),
        )

        this.afterPhysicsPipeline = pipe(
          createMatterPhysicsBodySyncSystem(matterBodyById),
          createPhaserBodySyncSystem(matterSpritesById)
        )

        // await this.connect();
        //
        // // Player's ship
        // this.playerShip = this.physics.add.sprite(400, 300, 'ship1');
        // this.playerShip.setDamping(true);
        // this.playerShip.setDrag(0.99);
        // this.playerShip.setMaxVelocity(220)
        //   .setBounce(0.9, 0.9)
        //   .setCollideWorldBounds(true)
        //   .setDepth(10);
        //
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
        //
        // // Keyboard controls
        // // @ts-ignore
        // this.cursors = this.input.keyboard?.addKeys({
        //     up: Phaser.Input.Keyboard.KeyCodes.UP,
        //     left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        //     down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        //     right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        //     shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
        // });
        //
        // // Colyseus code
        // this.room.state.players.onAdd((player, sessionId) => {
        //
        //     if (sessionId === this.room.sessionId) {
        //         // Skip the current player.
        //         return;
        //     }
        //
        //     const entity = this.physics.add.sprite(player.x, player.y, 'ship1');
        //     entity.setDamping(true);
        //     entity.setDrag(0.99);
        //
        //     console.log('played joined', player, sessionId);
        //     this.playerEntities[sessionId] = {
        //         body: entity,
        //         emitter: createEmitter(entity)
        //     };
        //     entity.x = player.x;
        //     entity.y = player.y;
        //     entity.setRotation(player.rotation);
        //     entity.setAngularVelocity(player.rotationVelocity);
        //     entity.setVelocity(player.velocityX, player.velocityY);
        //
        //     // listening for server updates
        //     player.onChange(() => {
        //         //
        //         // do not update local position immediately
        //         // we're going to LERP them during the render loop.
        //         //
        //         entity.setData('serverX', player.x);
        //         entity.setData('serverY', player.y);
        //         entity.setData('serverRotation', player.rotation);
        //         entity.setData('serverRotationVelocity', player.rotationVelocity);
        //         entity.setData('serverVelocityX', player.velocityX);
        //         entity.setData('serverVelocityY', player.velocityY);
        //         entity.setData('serverThrusting', player.thrusting);
        //     });
        // });
        //
        // // remove local reference when entity is removed from the server
        // this.room.state.players.onRemove((player, sessionId) => {
        //     const {body, emitter} = this.playerEntities[sessionId];
        //     if (body) {
        //         body.destroy();
        //     }
        //     if (emitter) {
        //         emitter.destroy();
        //     }
        //     delete this.playerEntities[sessionId];
        // });
        //
        // EventBus.emit('current-scene-ready', this);
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

        this.physicsManager.update(delta);

        this.afterPhysicsPipeline(this.world);

        this.pipeline(this.world);

        // console.log('time and delta', time, delta);


        // Colyseus code
        // skip loop if not connected yet.
        // if (!this.room) { return; }

        // this.room.send('position', {
        //     x: this.playerShip.x,
        //     y: this.playerShip.y,
        //     rotation: this.playerShip.rotation,
        //     // @ts-ignore
        //     rotationVelocity: this.playerShip.body.angularVelocity,
        //     velocityX: this.playerShip.body.velocity.x,
        //     velocityY: this.playerShip.body.velocity.y,
        //     thrusting: this.cursors.up.isDown,
        // });
        //
        // for (let sessionId in this.playerEntities) {
        //     // interpolate all player entities
        //     const {body, emitter} = this.playerEntities[sessionId];
        //     const { serverX, serverY } = body.data.values;
        //
        //     body.x = Phaser.Math.Linear(body.x, serverX, 0.2);
        //     body.y = Phaser.Math.Linear(body.y, serverY, 0.2);
        //
        //     // TODO: interpolate rotation and velocity as well
        //     body.setRotation(body.getData('serverRotation'));
        //     body.setAngularVelocity(body.getData('serverRotationVelocity'));
        //     body.setVelocity(body.getData('serverVelocityX'), body.getData('serverVelocityY'));
        //
        //     if (body.getData('serverThrusting')) {
        //         this.emitParticleFromShip(body, emitter);
        //     }
        // }
        //
        // // Movement
        // if (this.cursors.left.isDown) {
        //     this.playerShip.setAngularVelocity(-150);
        // } else if (this.cursors.right.isDown) {
        //     this.playerShip.setAngularVelocity(150);
        // } else {
        //     this.playerShip.setAngularVelocity(0);
        // }
        //
        // if (this.cursors.up.isDown) {
        //     this.emitParticleFromShip(this.playerShip, this.emitter);
        // } else {
        //     this.playerShip.setAcceleration(0);
        // }
        //
        // // Phaser.Math.RotateAroundDistance(this.emitter, this.playerShip.x / 18, this.playerShip.y / 18, this.playerShip.rotation, 10);
        // // Update the emitter position to behind the ship based on its angle
        // // this.emitter.setPosition(this.playerShip.x / 20, this.playerShip.y / 20);
        // // @ts-ignore
        // // this.emitter.setAngle({ min: this.playerShip.angle, max: this.playerShip.angle});
        // // this.emitter.setAngle(this.playerShip.angle);
        //
        // // Shooting (basic implementation)
        // if (Phaser.Input.Keyboard.JustDown(this.cursors.shoot)) {
        //     // Here, you would create a bullet and shoot it from the ship's position.
        //     // This code is omitted for brevity. You would need to add bullet physics and handling.
        //     console.log('Shoot!');
        // }
    }

    changeScene() {
        this.scene.start('GameOver');
    }
}
