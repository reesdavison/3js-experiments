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

  // let energy;

  const dp = obj.getDampeningParameters();
  const energy = obj.getNormalisedMassKineticEnergy(obj);

  if (obj.getNormalisedMassKineticEnergy) {
    // console.log("Energy ", energy);

    if (energy < dp.energyZeroThresh) {
      vel = [0.0, 0.0, 0.0];
    } else if (energy < dp.energyLowThresh) {
      vel = multiplyConst(vel, dp.lowDampener);
    } else if (energy < dp.energyHighThresh) {
      vel = multiplyConst(vel, dp.highDampener);
    }
  }

  const pos = addVectors(obj.position, multiplyConst(vel, TIME_STEP));

  obj.position = pos;
  obj.velocity = vel;

  if (obj.angularRotation && obj.angularVelocity) {
    if (energy) {
      if (energy < dp.energyZeroThresh) {
        obj.angularVelocity = [0, 0, 0];
      } else if (energy < dp.energyLowThresh) {
        obj.angularVelocity = multiplyConst(
          obj.angularVelocity,
          dp.lowDampener
        );
      } else if (energy < dp.energyHighThresh) {
        obj.angularVelocity = multiplyConst(
          obj.angularVelocity,
          dp.highDampener
        );
      }
    }

    const newAngularRotation = addVectors(
      obj.angularRotation,
      multiplyConst(obj.angularVelocity, TIME_STEP)
    );

    obj.angularRotation = newAngularRotation;
  }
}
