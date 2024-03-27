
export type ShipThrustDirection = -1 | 0 | 1;

export interface ShipStateData {
  x: number;
  y: number;
  rotation: number;
  rotationVelocity: number;
  velocityX: number;
  velocityY: number;
  thrustDirection: ShipThrustDirection;
}
