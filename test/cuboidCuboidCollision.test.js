import { gjkIntersection } from "../src/library/collision";
import {
  // getCornerIndicesForPlane,
  // getCuboidCorners,
  // getOuterPlaneNormals,
  // supportCuboid,
  createBox,
} from "../src/library/box";

import { expectVectorClose } from "./testHelpers";

import { describe, expect, it } from "vitest";
import { normaliseVec } from "../src/library/vector";

describe("collisions between two cuboids", () => {
  it("works for a simple case on x axis", () => {
    const cuboid1 = createBox(1, 1, 1, [0, 0, 0], [0, 0, 0], [1, 0, 0], 0);

    const xPosition = 0.95;

    const cuboid2 = createBox(
      1,
      1,
      1,
      [xPosition, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
      0
    );
    const collision = gjkIntersection(cuboid1, cuboid2);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [1, 0, 0]);
  });

  it("works for a simple case on y axis", () => {
    const cuboid1 = createBox(1, 1, 1, [0, 0, 0], [0, 0, 0], [1, 0, 0], 0);

    const yPosition = 0.95;

    const cuboid2 = createBox(
      1,
      1,
      1,
      [0, yPosition, 0],
      [0, 0, 0],
      [1, 0, 0],
      0
    );

    const collision = gjkIntersection(cuboid1, cuboid2);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [0, 1, 0]);
  });

  it("works for cubes along y=x", () => {
    const zTranslate = 2;
    const cuboid1 = createBox(
      1,
      1,
      1,
      [0, 0, zTranslate],
      [0, 0, 0],
      [1, 0, 0],
      0
    );

    const xyPosition = 0.95;
    const cuboid2 = createBox(
      1,
      1,
      1,
      [xyPosition, xyPosition, zTranslate],
      [0, 0, 0],
      [1, 0, 0],
      0
    );
    const collision = gjkIntersection(cuboid1, cuboid2);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [0, 1, 0]);
  });

  it("works for cubes along y=x=z with switched order", () => {
    const cuboid2 = createBox(1, 1, 1, [0, 0, 0], [0, 0, 0], [1, 0, 0], 0);
    const xyzPosition = 0.95;

    const cuboid1 = createBox(
      1,
      1,
      1,
      [xyzPosition, xyzPosition, xyzPosition],
      [0, 0, 0],
      [1, 0, 0],
      0
    );
    const collision = gjkIntersection(cuboid1, cuboid2);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [-1, 0, 0]);
  });

  it("works for case on x axis, 2nd cube rotated 45deg about z axis, with unaligned centers", () => {
    const cuboid1 = createBox(1, 10, 1, [0, 0, 0]);
    const halfDiag = Math.sqrt(0.5 ** 2 * 2);
    const xPosition = 0.5 + halfDiag - 0.05;
    const cuboid2 = createBox(
      1,
      1,
      1,
      [xPosition, 4, 0],
      [0, 0, 0],
      [0, 0, 1],
      Math.PI / 4
    );
    const { normal, obj1Closest, obj2Closest, obj1ContactArm, obj2ContactArm } =
      gjkIntersection(cuboid1, cuboid2);

    expectVectorClose(normal, [1, 0, 0]);
    expectVectorClose(obj1Closest, [0.5, 4, 0], 0.3);
    expectVectorClose(obj2Closest, [0.45, 4, 0], 0.05);
    expectVectorClose(obj1ContactArm, [0.5, 4, 0], 0.05);
    expectVectorClose(obj2ContactArm, [-halfDiag, 0, 0], 0.05);
  });

  it("works for cube sat on another", () => {
    const cuboid1 = createBox(10, 10, 10, [0, -5, 0]);
    const cuboid2 = createBox(1, 1, 1, [0, 0.49, 0]);
    const {
      normal,
      obj1Closest,
      obj2Closest,
      obj1ContactArm,
      obj2ContactArm,
      collide,
    } = gjkIntersection(cuboid1, cuboid2);
    console.log("Normal3", normal, collide);

    expectVectorClose(normal, [0, 1, 0]);
    expectVectorClose(obj1Closest, [0, 0, 0], 0.05); //[0.5, 4, 0]
    expectVectorClose(obj2Closest, [0, 0, 0], 0.05);
    expectVectorClose(obj1ContactArm, [0, 5, 0], 0.05);
    expectVectorClose(obj2ContactArm, [0, -0.5, 0], 0.05);
  });
});
