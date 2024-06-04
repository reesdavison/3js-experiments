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
import { normaliseVec } from "../src/library/vector";

describe("collisions between two cuboids", () => {
  it("works for a simple case on x axis", () => {
    const cuboid1 = {
      shape: "box",
      corners: getCuboidCorners(1, 1, 1, [0, 0, 0], [1, 0, 0], 0),
      position: [0, 0, 0],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };

    const xPosition = 0.95;
    const cuboid2 = {
      shape: "box",
      corners: getCuboidCorners(1, 1, 1, [xPosition, 0, 0], [1, 0, 0], 0),
      position: [xPosition, 0, 0],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };
    const collision = gjkIntersection(cuboid1, cuboid2);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [1, 0, 0]);
  });

  it("works for a simple case on y axis", () => {
    const cuboid1 = {
      shape: "box",
      corners: getCuboidCorners(1, 1, 1, [0, 0, 0], [1, 0, 0], 0),
      position: [0, 0, 0],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };

    const yPosition = 0.95;
    const cuboid2 = {
      shape: "box",
      corners: getCuboidCorners(1, 1, 1, [0, yPosition, 0], [1, 0, 0], 0),
      position: [0, yPosition, 0],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };
    const collision = gjkIntersection(cuboid1, cuboid2);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [0, 1, 0]);
  });

  it("works for cubes along y=x", () => {
    const zTranslate = 2;

    const cuboid1 = {
      shape: "box",
      corners: getCuboidCorners(1, 1, 1, [0, 0, zTranslate], [1, 0, 0], 0),
      position: [0, 0, zTranslate],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };

    const xyPosition = 0.95;
    const cuboid2 = {
      shape: "box",
      corners: getCuboidCorners(
        1,
        1,
        1,
        [xyPosition, xyPosition, zTranslate],
        [1, 0, 0],
        0
      ),
      position: [xyPosition, xyPosition, zTranslate],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };
    const collision = gjkIntersection(cuboid1, cuboid2);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [0, 1, 0]);
  });

  it("works for cubes along y=x=z with switched order", () => {
    const cuboid2 = {
      shape: "box",
      corners: getCuboidCorners(1, 1, 1, [0, 0, 0], [1, 0, 0], 0),
      position: [0, 0, 0],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };

    const xyzPosition = 0.95;
    const cuboid1 = {
      shape: "box",
      corners: getCuboidCorners(
        1,
        1,
        1,
        [xyzPosition, xyzPosition, xyzPosition],
        [1, 0, 0],
        0
      ),
      position: [xyzPosition, xyzPosition, xyzPosition],
      support: supportCuboid,
      getOuterPlaneNormals,
      getCornerIndicesForPlane,
    };
    const collision = gjkIntersection(cuboid1, cuboid2);
    expect(collision.collide).toBeTruthy();
    expectVectorClose(collision.normal, [-1, 0, 0]);
  });
});
