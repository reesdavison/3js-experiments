import { TIME_STEP } from "./constants";
import { addVectors, magnitude, multiplyConst } from "./vector";

export function eulerStep(obj) {
  // this is the semi-implicit euler method
  // that's because we update position using
  // a future velocity measurement

  // if we were to use the old velocity, this
  // would be explicit Euler integration
  const airResistanceCoef = 0.1;
  const airResistance = multiplyConst(obj.velocity, airResistanceCoef);

  const totalForceAboutCenter = addVectors(obj.centerForce, airResistance);

  const acc = multiplyConst(totalForceAboutCenter, 1 / obj.mass);
  let vel = addVectors(obj.velocity, multiplyConst(acc, TIME_STEP));

  const tol = 0.1;

  if (magnitude(vel) < tol) {
    vel = [0, 0, 0];
  }
  const pos = addVectors(obj.position, multiplyConst(vel, TIME_STEP));

  obj.position = pos;
  obj.velocity = vel;

  if (obj.angularRotation && obj.angularVelocity) {
    const angularDamping = 0.9;
    obj.angularVelocity = multiplyConst(obj.angularVelocity, angularDamping);

    if (magnitude(obj.angularVelocity < tol)) {
      obj.angularVelocity = [0, 0, 0];
    }
    const newAngularRotation = addVectors(
      obj.angularRotation,
      multiplyConst(obj.angularVelocity, TIME_STEP)
    );
    obj.angularRotation = newAngularRotation;
  }
}
