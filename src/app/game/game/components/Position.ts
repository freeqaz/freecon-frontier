import {
	defineComponent,
	Types
} from 'bitecs'

export const PhysicsBody = defineComponent({
	x: Types.f32,
	y: Types.f32,
	angle: Types.f32,
	velocityX: Types.f32,
	velocityY: Types.f32,
	angularVelocity: Types.f32,
	forceX: Types.f32,
	forceY: Types.f32,
	isStatic: Types.ui8
})
