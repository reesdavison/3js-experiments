import { sat, getOverlap, projectionsOverlap } from "../src/library/sat";
import { createBox } from "../src/library/box";

import { expectVectorClose } from "./testHelpers";

import { describe, expect, it } from "vitest";
import { normaliseVec } from "../src/library/vector";

function expProjection(p1, p2, correctOverlap) {
  expect(projectionsOverlap(p1, p2)).toBeTruthy();
  expect(getOverlap(p1, p2)).toBeCloseTo(correctOverlap);
  expect(projectionsOverlap(p2, p1)).toBeTruthy();
  expect(getOverlap(p2, p1)).toBeCloseTo(correctOverlap);
}

describe("test getoverlap", () => {
  it("works for pos cases", () => {
    const p1 = [0, 10];
    const p2a = [5, 6];
    expProjection(p1, p2a, 1);

    const p2b = [-1, 2];
    expProjection(p1, p2b, 2);

    const p2c = [8, 12];
    expProjection(p1, p2c, 2);
  });
});

describe("separating axis algorithm between 2 cubes", () => {
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
    const { direction, hasOverlap, overlapDist, smallestObjIndex } = sat(
      cuboid1,
      cuboid2
    );
    expect(hasOverlap).toBeTruthy();
    expect(overlapDist).toBeCloseTo(0.05);
    expectVectorClose(direction, [1, 0, 0]);
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

    const { direction, hasOverlap, overlapDist, smallestObjIndex } = sat(
      cuboid1,
      cuboid2
    );
    expect(hasOverlap).toBeTruthy();
    expectVectorClose(direction, [0, 1, 0]);
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
    const { direction, hasOverlap, overlapDist, smallestObjIndex } = sat(
      cuboid1,
      cuboid2
    );
    expect(hasOverlap).toBeTruthy();
    expect(overlapDist).toBeCloseTo(0.05);
    // it picks an arbitrary direction for this
    expectVectorClose(direction, [0, 1, 0]);
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
    const { direction, hasOverlap, overlapDist, smallestObjIndex } = sat(
      cuboid1,
      cuboid2
    );

    expect(hasOverlap).toBeTruthy();
    expectVectorClose(direction, [1, 0, 0]);
    expect(overlapDist).toBeCloseTo(0.05);
  });

  it("works for cube sat on another", () => {
    const cuboid1 = createBox(10, 10, 10, [0, -5, 0]);
    const cuboid2 = createBox(1, 1, 1, [0, 0.49, 0]);

    const { direction, hasOverlap, overlapDist, smallestObjIndex } = sat(
      cuboid1,
      cuboid2
    );
    expect(hasOverlap).toBeTruthy();
    expectVectorClose(direction, [0, 1, 0]);
    expect(overlapDist).toBeCloseTo(0.01);
  });
});
