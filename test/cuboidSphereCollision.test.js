import {
  supportSphere,
  supportCuboid,
  getCuboidCorners,
  gjkIntersection,
} from "../src/js/shared";

import { describe, expect, it } from "vitest";

describe("collisions between cuboid and sphere", () => {
  it("works for a simple case", () => {
    const sphere = {
      radius: 1,
      position: [0, 0, 0],
      support: supportSphere,
    };
    const cuboid = {
      corners: getCuboidCorners(1, 1, 1, [1.5, 0, 0], [1, 0, 0], 0),
      position: [1.5, 0, 0],
      support: supportCuboid,
    };

    const collision = gjkIntersection(sphere, cuboid);
    collision;
  });
});
