import { TIME_STEP } from "./constants";
import {
  addVectors,
  magnitude,
  multiplyConst,
  invertVector,
  subtractVectors,
} from "./vector";

export function eulerStep(obj) {
  // this is the semi-implicit euler method
  // that's because we update position using
  // a future velocity measurement

  const totalForceAboutCenter = obj.centerForce;

  const acc = multiplyConst(totalForceAboutCenter, 1 / obj.mass);
  let vel = addVectors(obj.velocity, multiplyConst(acc, TIME_STEP));

  let energy;
  const MIN_ENERGY_HIGH = 0.3;
  const MIN_ENERGY_LOW = 0.1;

  if (obj.getNormalisedMassKineticEnergy) {
    energy = obj.getNormalisedMassKineticEnergy(obj);
    if (energy < MIN_ENERGY_HIGH) {
      vel = multiplyConst(vel, 0.9);
    }
    if (energy < MIN_ENERGY_LOW) {
      vel = [0, 0, 0];
    }
  }

  const pos = addVectors(obj.position, multiplyConst(vel, TIME_STEP));

  obj.position = pos;
  obj.velocity = vel;

  if (obj.angularRotation && obj.angularVelocity) {
    if (energy && energy < MIN_ENERGY_HIGH) {
      obj.angularVelocity = multiplyConst(obj.angularVelocity, 0.9);
    }
    if (energy && energy < MIN_ENERGY_LOW) {
      obj.angularVelocity = [0, 0, 0];
    }

    const newAngularRotation = addVectors(
      obj.angularRotation,
      multiplyConst(obj.angularVelocity, TIME_STEP)
    );

    obj.angularRotation = newAngularRotation;
  }
}
