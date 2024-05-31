import { gjkIntersection } from "../src/library/collision";
import { supportSphere } from "../src/library/sphere";
import {
  getCornerIndicesForPlane,
  getCuboidCorners,
  getOuterPlaneNormals,
  supportCuboid,
} from "../src/library/box";

import { expectVectorClose } from "./testHelpers";

import { describe, expect, it } from "vitest";

describe("collisions between cuboid and sphere", () => {
  it("works for a simple case on x axis", () => {
    const sphere = {
      radius: 1,
      position: [0, 0, 0],
      support: supportSphere,
    };

    const xPosition = 1.45;
    const cuboid = {
      corners: getCuboidCorners(1, 1, 1, [xPosition, 0, 0], [1, 0, 0], 0),
      position: [xPosition, 0, 0],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };
    const collision = gjkIntersection(sphere, cuboid);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [1, 0, 0]);
  });

  it("doesnt collide for a simple case on x axis", () => {
    const sphere = {
      radius: 1,
      position: [0, 0, 0],
      support: supportSphere,
    };

    const xPosition = 1.55;
    const cuboid = {
      corners: getCuboidCorners(1, 1, 1, [xPosition, 0, 0], [1, 0, 0], 0),
      position: [xPosition, 0, 0],
      support: supportCuboid,
    };
    const collision = gjkIntersection(sphere, cuboid);
    expect(collision.collide).toBeFalsy();
  });
});
