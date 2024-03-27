import { Types, defineComponent } from 'bitecs'

export const ExhaustThrustEmitter = defineComponent({
	// -1 for backwards, 0 for none, 1 for forwards
	thrustDirection: Types.i8,
	thrustTexture: Types.ui8,
});

export const NetworkShip = defineComponent({
	lastReceivedServerUpdateTimestamp: Types.f64,
	lastServerPositionX: Types.f32,
	lastServerPositionY: Types.f32,
	lastServerRotation: Types.f32,
	lastServerVelocityX: Types.f32,
	lastServerVelocityY: Types.f32,
});

export const PlayerShip = defineComponent({})
