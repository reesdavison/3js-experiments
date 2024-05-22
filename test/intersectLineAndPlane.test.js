import { intersectLineAndPlane } from "../src/library/vector";

import { expectVectorClose } from "./testHelpers";

import { describe, it } from "vitest";

describe("intersection between a line and plane", () => {
  it("works for line [1,1,1] from origin towards a -y plane", () => {
    const linePoint = [0, 0, 0];
    const lineDirection = [1, 1, 1];
    const planeDirection = [0, -1, 0];
    const planePoint = [5, 14, 18]; // the 14 sets the intersect

    const intersect = intersectLineAndPlane(
      linePoint,
      planePoint,
      lineDirection,
      planeDirection
    );
    expectVectorClose(intersect, [14, 14, 14]);
  });
});
