import { describe, it } from "vitest";

import { rotateVectorArray } from "../src/library/vector";
import { expectVectorClose } from "./testHelpers";

describe("rotation works anticlockwise for RH frame", () => {
  it("works for 1, 1 vector", () => {
    const angle = 30 * (Math.PI / 180); // 30 degrees
    const axis = [0, 0, 1];
    const vectorList = [[1, 1, 0]];
    const rotated = rotateVectorArray(vectorList, axis, angle);
    expect(rotated.length).toBe(1);
    expectVectorClose(rotated[0], [
      Math.cos(angle) - Math.sin(angle),
      Math.sin(angle) + Math.cos(angle),
      0,
    ]);
  });

  it("works for 1, -1 vector", () => {
    // turn 30deg clockwise about origin
    // x should be same as above
    // y should be negative

    const angle = -30 * (Math.PI / 180); // 30 degrees
    const axis = [0, 0, 1];
    const vectorList = [[1, -1, 0]];
    const rotated = rotateVectorArray(vectorList, axis, angle);
    expect(rotated.length).toBe(1);

    const posAngle = Math.abs(angle);
    expectVectorClose(rotated[0], [
      Math.cos(posAngle) - Math.sin(posAngle),
      -(Math.sin(posAngle) + Math.cos(posAngle)),
      0,
    ]);
  });
});
