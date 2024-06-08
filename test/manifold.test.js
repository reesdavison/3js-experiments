import { getContactManifold, bestPlane } from "../src/library/manifold";
import { createBox } from "../src/library/box";

import { expectVectorClose } from "./testHelpers";

import { describe, expect, it } from "vitest";
import { addVectors, multiplyConst, normaliseVec } from "../src/library/vector";

describe("get best plane", () => {
  it("works for all directions", () => {
    const obj = createBox(1, 1, 1, [0, 0, 0], [0, 0, 0], [1, 0, 0], 0);

    let bestNorm;
    ({ bestNorm } = bestPlane(obj, [1, 0, 0]));
    expectVectorClose(bestNorm, [1, 0, 0]);

    ({ bestNorm } = bestPlane(obj, [0, 1, 0]));
    expectVectorClose(bestNorm, [0, 1, 0]);

    ({ bestNorm } = bestPlane(obj, [0, 0, 1]));
    expectVectorClose(bestNorm, [0, 0, 1]);

    ({ bestNorm } = bestPlane(obj, [-1, 0, 0]));
    expectVectorClose(bestNorm, [-1, 0, 0]);

    ({ bestNorm } = bestPlane(obj, [0, -1, 0]));
    expectVectorClose(bestNorm, [0, -1, 0]);

    ({ bestNorm } = bestPlane(obj, [0, 0, -1]));
    expectVectorClose(bestNorm, [0, 0, -1]);
  });
});

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
    const cp = getContactManifold(cuboid1, cuboid2, [1, 0, 0]);

    // contact manifold on cube 2's left plane
    expect(cp).toHaveLength(4);
    cp.forEach((vec) => {
      expect(vec[0]).toBeCloseTo(0.45);
    });
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

    const cp = getContactManifold(cuboid1, cuboid2, [0, 1, 0]);
    expect(cp).toHaveLength(4);
    cp.forEach((vec) => {
      expect(vec[1]).toBeCloseTo(0.45);
    });
  });

  it("works for cubes along y=x", () => {
    const zTranslate = 0;
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
    const cp = getContactManifold(cuboid1, cuboid2, [0, 1, 0]);
    expect(cp).toHaveLength(4);
    // very tiny plane between 0.45 and 0.5, y=0.45
    expectVectorClose(cp[0], [0.45, 0.45, 0.5]);
    expectVectorClose(cp[1], [0.45, 0.45, -0.5]);
    expectVectorClose(cp[2], [0.5, 0.45, -0.5]);
    expectVectorClose(cp[3], [0.5, 0.45, 0.5]);
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
    const cp = getContactManifold(cuboid1, cuboid2, [-1, 0, 0]);
    expect(cp).toHaveLength(4);
    expectVectorClose(cp[0], [0.5, 0.5, 0.45]);
    expectVectorClose(cp[1], [0.5, 0.5, 0.5]);
    expectVectorClose(cp[2], [0.5, 0.45, 0.5]);
    expectVectorClose(cp[3], [0.5, 0.45, 0.45]);
    expectVectorClose(
      multiplyConst(addVectors(...cp), 0.25),
      [0.5, 0.475, 0.475]
    );
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

    const cp = getContactManifold(cuboid1, cuboid2, [1, 0, 0]);
    // manifold is a line!
    expect(cp).toHaveLength(2);
    expectVectorClose(cp[0], [0.45, 4, 0.5]);
    expectVectorClose(cp[1], [0.45, 4, -0.5]);
    expectVectorClose(multiplyConst(addVectors(...cp), 0.5), [0.45, 4, 0]);
  });

  it("works for cube sat on another", () => {
    const cuboid1 = createBox(10, 10, 10, [0, -5, 0]);
    const cuboid2 = createBox(1, 1, 1, [0, 0.49, 0]);

    const cp = getContactManifold(cuboid1, cuboid2, [0, 1, 0]);
    expect(cp).toHaveLength(4);
    expectVectorClose(cp[0], [-0.5, -0.01, 0.5]);
    expectVectorClose(cp[1], [-0.5, -0.01, -0.5]);
    expectVectorClose(cp[2], [0.5, -0.01, -0.5]);
    expectVectorClose(cp[3], [0.5, -0.01, 0.5]);
    expectVectorClose(multiplyConst(addVectors(...cp), 0.25), [0, -0.01, 0]);
  });
});
