import { Vector } from 'matter-js';
import {POSITION_UPDATES_PER_SECOND} from "@/common/NetworkConstants";

interface PositionState {
  Position: Vector;
  Velocity: Vector;
}

interface PositionLerpState {
  Velocity: Vector;
  Position: Vector;
}

/**
 * Interpolates the player's position based on the server's position and velocity.
 * This is called per frame so that we can smoothly interpolate based on the projected future position.
 * @param current
 * @param next
 * @param deltaFromLastUpdate
 */
export function smartUpdatePosition(current: PositionState, next: PositionState, deltaFromLastUpdate: number): PositionLerpState {
  // How many milliseconds until the next position update is expected.
  const timeUntilNextUpdate = 1000 / POSITION_UPDATES_PER_SECOND;

  // How far we are between the last update and the next update.
  // This is a value between 0 and 1 that represents the percentage of time that has passed.
  const percentageOfNextUpdate = Math.min(
    deltaFromLastUpdate / timeUntilNextUpdate,
    POSITION_UPDATES_PER_SECOND * 2
  );

  // TODO: Calculate if the player is turning + accelerating and add it to the position calculation
  const projectedPosition = Vector.add(
    next.Position,
    Vector.mult(next.Velocity, timeUntilNextUpdate)
  );

  // Calculate where we think the player should be at this point in time
  const expectedServerCurrentPosition = Vector.add(
    next.Position,
    Vector.mult(next.Velocity, percentageOfNextUpdate)
  );

  // The distance between our client's position and where we think they should be based on the last update.
  // TODO: Make this lerp logic work based on projecting the position at the current velocity.
  // This code in theory is jank right now lol
  const distanceFromServerCurrent = Vector.magnitude(Vector.sub(current.Position, expectedServerCurrentPosition));

  // If we have desynced a decent amount, we interpolate our position towards the server's position
  if (distanceFromServerCurrent > 50) {
    const interpolatedPosition = Vector.add(
      current.Position,
      Vector.mult(
        Vector.sub(expectedServerCurrentPosition, current.Position),
        // Number of frames per second / number of frames until next update
        // This is how far we interpolate forward each step.
        1000 / 60 / timeUntilNextUpdate
      )
    );

    return {
      // Velocity doesn't matter here since we're snapping to a new position.
      Velocity: next.Velocity,
      Position: interpolatedPosition
    };
  }

  // Calculate the distance from where we think the player should be at the next update and where we think we will be.
  const distanceFromServerFuture = Vector.magnitude(
    // TODO: We should calculate our future position as well. But it's a bit complicated to do per frame.
    Vector.sub(current.Position, projectedPosition)
  );

  if (distanceFromServerFuture > 20) {
    // We're going to deviate from where the server will be, so we adjust our velocity to reach the projected position
    const positionDifferenceVec = Vector.sub(projectedPosition, current.Position);

    const direction = Vector.normalise(positionDifferenceVec);

    const speed = Vector.magnitude(next.Velocity);
    const newVelocity = Vector.mult(direction, speed);

    return {
      Velocity: newVelocity,
      Position: current.Position
    };
  }

  return {
    Velocity: next.Velocity,
    Position: current.Position
  };
}
