import { resolveVelocityWithRotations } from "../src/library/collision";
import { createBox } from "../src/library/box";
import { createSphere } from "../src/library/sphere";

import { expectVectorClose } from "./testHelpers";

import { describe, expect, it } from "vitest";

describe("resolve velocity withRotations", () => {
  it("sphere at rest on a fixed plane", () => {
    const bottomPlane = createBox(
      10,
      10,
      0.2,
      [0, -0.1, 0],
      [0, 0, 0],
      [1, 0, 0],
      Math.PI / 2,
      10 ** 10,
      true
    );

    const sphere = createSphere(
      [0, 0.499, 0],
      [0, 0, 0],
      1,
      0.5,
      0.7,
      false,
      0,
      [1, 0, 0]
    );
    const collision = {
      collide: true,
      obj1: bottomPlane,
      obj2: sphere,
      normal: [0, 1, 0],
      obj1ContactArm: [0, 0.1, 0],
      obj2ContactArm: [0, -0.5, 0],
    };

    resolveVelocityWithRotations(collision);

    const v1 = collision.obj1.velocity;
    const v2 = collision.obj2.velocity;
    const w1 = collision.obj1.angularVelocity;
    const w2 = collision.obj2.angularVelocity;

    expectVectorClose(v1, [0, 0, 0]);
    expectVectorClose(v2, [0, 0, 0]);
    expectVectorClose(w1, [0, 0, 0]);
    expectVectorClose(w2, [0, 0, 0]);
  });

  it("sphere rolling on a fixed plane", () => {
    const bottomPlane = createBox(
      10,
      10,
      0.2,
      [0, -0.1, 0],
      [0, 0, 0],
      [1, 0, 0],
      Math.PI / 2,
      10 ** 10,
      true
    );

    const sphere = createSphere(
      [0, 0.499, 0],
      // we dont get an impulse unless
      // some component parallel to normal of collision
      [1, -0.1, 0],
      1,
      0.5,
      0.7,
      false,
      -1,
      [0, 0, 1]
    );
    const collision = {
      collide: true,
      obj1: bottomPlane,
      obj2: sphere,
      normal: [0, 1, 0],
      obj1ContactArm: [0, 0.1, 0],
      obj2ContactArm: [0, -0.5, 0],
    };

    const vBefore = [...sphere.velocity];
    const avBefore = [...sphere.angularVelocity];

    resolveVelocityWithRotations(collision);

    const v1 = collision.obj1.velocity;
    const v2 = collision.obj2.velocity;
    const w1 = collision.obj1.angularVelocity;
    const w2 = collision.obj2.angularVelocity;

    expectVectorClose(v1, [0, 0, 0]);
    expectVectorClose(w1, [0, 0, 0]);

    expect(v2[0]).toBeLessThan(vBefore[0]);
    expect(v2[1] * vBefore[1]).toBeLessThan(0);

    expect(w2[2]).toBeLessThan(avBefore[2]);
  });
});
