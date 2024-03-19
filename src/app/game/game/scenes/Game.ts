import 'phaser';
import { EventBus } from '../EventBus';
import { Room, Client } from "colyseus.js";
import {MyRoomState, Player} from "@/colyseus/rooms/schema/MyRoomState";

export class Game extends Phaser.Scene {
    private playerShip!: Phaser.Physics.Arcade.Sprite;
    private cursors!: { [key: string]: Phaser.Input.Keyboard.Key };
    private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    playerEntities: { [sessionId: string]: Phaser.Types.Physics.Arcade.ImageWithDynamicBody } = {};
    private room!: Room<MyRoomState>;

    constructor() {
        super('Game');
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

    async create() {
        this.cameras.main.setBackgroundColor(0x000000);

        await this.connect();

        // Player's ship
        this.playerShip = this.physics.add.sprite(400, 300, 'ship1');
        this.playerShip.setDamping(true);
        this.playerShip.setDrag(0.99);
        this.playerShip.setMaxVelocity(220)
          .setBounce(0.9, 0.9)
          .setCollideWorldBounds(true)
          .setDepth(10);

        // Particle effects for the ship
        this.emitter = this.add.particles(0, 0, 'flares', {
            frame: 'white',
            color: [ 0xfacc22, 0xf89800, 0xf83600, 0x9f0404 ],
            colorEase: 'quad.out',
            speed: 200,
            scale: { start: 0.09, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            emitting: false,
            follow: this.playerShip
        }).setDepth(-1);

        // Attach the emitter to the ship
        // this.emitter.startFollow(this.playerShip, 0, 0);
        // this.emitter.start();

        // Keyboard controls
        // @ts-ignore
        this.cursors = this.input.keyboard?.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Colyseus code
        this.room.state.players.onAdd((player, sessionId) => {
            const entity = this.physics.add.sprite(player.x, player.y, 'ship1');
            console.log('played joined', player, sessionId);

            if (sessionId === this.room.sessionId) {
                // Skip the current player.
                return;
            }
            this.playerEntities[sessionId] = entity;
            
            // listening for server updates
            player.onChange(() => {
                //
                // do not update local position immediately
                // we're going to LERP them during the render loop.
                //
                entity.setData('serverX', player.x);
                entity.setData('serverY', player.y);
            });
        });

        // remove local reference when entity is removed from the server
        this.room.state.players.onRemove((player, sessionId) => {
            const entity = this.playerEntities[sessionId];
            if (entity) {
                entity.destroy();
                delete this.playerEntities[sessionId]
            }
        });

        EventBus.emit('current-scene-ready', this);
    }

    update() {

        //Colyseus code
        // skip loop if not connected yet.
        if (!this.room) { return; }

        // send input to the server
        // this.inputPayload.left = this.cursors.left.isDown;
        // this.inputPayload.right = this.cursors.right.isDown;
        // this.inputPayload.up = this.cursors.up.isDown;
        // this.inputPayload.down = this.cursors.down.isDown;

        // this.room.send(0, this.inputPayload);

        this.room.send('position', { x: this.playerShip.x, y: this.playerShip.y });

        for (let sessionId in this.playerEntities) {
            // interpolate all player entities
            const entity = this.playerEntities[sessionId];
            const { serverX, serverY } = entity.data.values;

            entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
            entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
        }

        // Movement
        if (this.cursors.left.isDown) {
            this.playerShip.setAngularVelocity(-150);
        } else if (this.cursors.right.isDown) {
            this.playerShip.setAngularVelocity(150);
        } else {
            this.playerShip.setAngularVelocity(0);
        }

        if (this.cursors.up.isDown) {
            // @ts-ignore
            this.physics.velocityFromRotation(this.playerShip.rotation, 200, this.playerShip.body?.acceleration);

            const particle = this.emitter.emitParticleAt(this.playerShip.x, this.playerShip.y, 1);
            if (particle) {

                // Minimum speed of the particles. Makes it look better when thrusting against a wall, for example.
                const minParticleSpeed = 300;
                // Factor to control the speed based on the ship's speed
                const speedFactor = 1.2;
                const shipAngleInRadians = this.playerShip.rotation;

                // If the ship has a velocity, adjust the particle velocity based on it
                if (this.playerShip.body) {
                    const shipSpeed = Math.sqrt(Math.pow(this.playerShip.body.velocity.x, 2) + Math.pow(this.playerShip.body.velocity.y, 2));

                    // Pick either speed for the particle based on either the ship's speed or the minimum speed
                    const adjustedSpeed = Math.max(minParticleSpeed, shipSpeed * speedFactor);

                    // Recalculate base velocities with adjusted speed
                    particle.velocityX = Math.cos(shipAngleInRadians) * adjustedSpeed * -1;
                    particle.velocityY = Math.sin(shipAngleInRadians) * adjustedSpeed * -1;
                }
            }
        } else {
            this.playerShip.setAcceleration(0);
        }

        // Phaser.Math.RotateAroundDistance(this.emitter, this.playerShip.x / 18, this.playerShip.y / 18, this.playerShip.rotation, 10);
        // Update the emitter position to behind the ship based on its angle
        // this.emitter.setPosition(this.playerShip.x / 20, this.playerShip.y / 20);
        // @ts-ignore
        // this.emitter.setAngle({ min: this.playerShip.angle, max: this.playerShip.angle});
        // this.emitter.setAngle(this.playerShip.angle);

        // Shooting (basic implementation)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.shoot)) {
            // Here, you would create a bullet and shoot it from the ship's position.
            // This code is omitted for brevity. You would need to add bullet physics and handling.
            console.log('Shoot!');
        }
    }

    changeScene() {
        this.scene.start('GameOver');
    }
}
