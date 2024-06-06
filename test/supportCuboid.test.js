import { describe, it } from "vitest";

import { supportCuboid, createBox } from "../src/library/box";
import { expectVectorClose } from "./testHelpers";

describe("support cuboid works as expected", () => {
  const unitCube = createBox(2, 2, 2, [0, 0, 0], [0, 0, 0]);

  it("works for right direction unit sphere", () => {
    const direction = [1, 0, 0];
    const intersect = supportCuboid(unitCube, direction);
    expectVectorClose(intersect, [1, 1, 1]);
  });

  it("works for left direction unit sphere", () => {
    const direction = [-1, 0, 0];
    const intersect = supportCuboid(unitCube, direction);
    expectVectorClose(intersect, [-1, 1, 1]);
  });

  it("works for an angle", () => {
    const direction = [1, 0.5, 0];
    const intersect = supportCuboid(unitCube, direction);
    expectVectorClose(intersect, [1, 1, 1]);
  });

  it("works for an angle opposite", () => {
    const direction = [-1, -1, 1];
    const intersect = supportCuboid(unitCube, direction);
    expectVectorClose(intersect, [-1, -1, 1]);
  });

  it("works for a rotated cube", () => {
    const direction = [0, 1, 0];
    const angle = 30 * (Math.PI / 180); // 30 degrees
    const cube = createBox(2, 2, 2, [0, 0, 0], [0, 0, 0], [0, 0, 1], angle);

    const support = supportCuboid(cube, direction);

    expectVectorClose(support, [
      Math.cos(angle) - Math.sin(angle),
      Math.sin(angle) + Math.cos(angle),
      1,
    ]);
  });
});
