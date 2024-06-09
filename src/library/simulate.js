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

  // if we were to use the old velocity, this
  // would be explicit Euler integration
  // const airResistanceCoef = 10;
  // const airResistance = multiplyConst(
  //   invertVector(obj.velocity),
  //   airResistanceCoef
  // );
  // console.log(airResistance);

  // const totalForceAboutCenter = addVectors(obj.centerForce, airResistance);
  const totalForceAboutCenter = obj.centerForce;

  const acc = multiplyConst(totalForceAboutCenter, 1 / obj.mass);
  let vel = addVectors(obj.velocity, multiplyConst(acc, TIME_STEP));

  // if (magnitude(vel) < 0.01) {
  //   vel = [0, 0, 0];
  // }
  const pos = addVectors(obj.position, multiplyConst(vel, TIME_STEP));

  obj.position = pos;
  obj.velocity = vel;

  if (obj.angularRotation && obj.angularVelocity) {
    // const angularDamping = 0.95;
    // obj.angularVelocity = multiplyConst(obj.angularVelocity, angularDamping);

    // if (magnitude(obj.angularVelocity < 0.001)) {
    //   obj.angularVelocity = [0, 0, 0];
    // }
    const newAngularRotation = addVectors(
      obj.angularRotation,
      multiplyConst(obj.angularVelocity, TIME_STEP)
    );
    obj.angularRotation = newAngularRotation;
  }
}
