import { OctreeNode } from "../src/library/octree";
import { expectVectorClose } from "./testHelpers";

import { describe, it, expect } from "vitest";
import { sum, getRandomInt } from "../src/library/helpers";
import { basicCollisionSphereTest } from "../src/library/collision";

describe("octree subdivide", () => {
  it("works for simple case", () => {
    const bounds = { x: 0, y: 0, z: 0, size: 10 };
    const root = new OctreeNode(bounds);

    root.subdivide();
    expect(root.children.length).toBe(8);
    const childBounds = root.children.map((child) => child.bounds);
    expect(childBounds).toStrictEqual([
      {
        x: -2.5,
        y: -2.5,
        z: -2.5,
        size: 5,
      },
      {
        x: 2.5,
        y: -2.5,
        z: -2.5,
        size: 5,
      },
      {
        x: -2.5,
        y: 2.5,
        z: -2.5,
        size: 5,
      },
      {
        x: 2.5,
        y: 2.5,
        z: -2.5,
        size: 5,
      },
      {
        x: -2.5,
        y: -2.5,
        z: 2.5,
        size: 5,
      },
      {
        x: 2.5,
        y: -2.5,
        z: 2.5,
        size: 5,
      },
      {
        x: -2.5,
        y: 2.5,
        z: 2.5,
        size: 5,
      },
      {
        x: 2.5,
        y: 2.5,
        z: 2.5,
        size: 5,
      },
    ]);
  });
});

describe("octree node contains object perfectly", () => {
  it("works for simple case", () => {
    const bounds = { x: 0, y: 0, z: 0, size: 10 };
    const root = new OctreeNode(bounds);
    root.subdivide();
    const object = { getBounds: () => ({ x: 1, y: 1, z: 1, size: 0.1 }) };
    expect(root.containsObjectPerfectly(object.getBounds())).toBeTruthy();
    const results = root.children.map((child) =>
      child.containsObjectPerfectly(object.getBounds())
    );
    expect(sum(results)).toBe(1);
  });

  it("returns false for out of bounds case", () => {
    const bounds = { x: 0, y: 0, z: 0, size: 10 };
    const root = new OctreeNode(bounds);
    const object = { getBounds: () => ({ x: 9, y: 9, z: 9, size: 0.1 }) };
    expect(root.containsObjectPerfectly(object.getBounds())).toBeFalsy();
  });
});

describe("octree insert", () => {
  it("foo", () => {
    // this describes a 10 by 10 box centered around [0, 0, 0]
    const bounds = { x: 0, y: 0, z: 0, size: 5 };
    const root = new OctreeNode(bounds, () => {}, 0, 1);

    const object1 = {
      name: "box1",
      getBounds: () => ({ x: 1, y: 1, z: 1, size: 0.1 }),
    };
    const object2 = {
      name: "box2",
      getBounds: () => ({ x: -1, y: -1, z: -1, size: 0.1 }),
    };

    root.insert(object1);
    root.insert(object2);
    expect(root.children.length).toBe(8);
    expect(root.children[0].objects[0].name).toBe("box2");
    expect(root.children[7].objects[0].name).toBe("box1");
  });
});

describe("check for collisions", () => {
  it("detects 1 simple collision", () => {
    const bounds = { x: 0, y: 0, z: 0, size: 5 };
    const root = new OctreeNode(bounds, basicCollisionSphereTest, 0, 1);

    const object1 = {
      name: "box1",
      getBounds: () => ({ x: 1, y: 1, z: 1, size: 0.2 }),
    };
    const object2 = {
      name: "box2",
      getBounds: () => ({ x: 1.1, y: 1.1, z: 1, size: 0.2 }),
    };

    root.insert(object1);
    root.insert(object2);

    const { collisions } = root.checkCollisions();
    expect(collisions.length).toBe(1);
    expect(collisions[0].collide).toBeTruthy();
  });

  it("works for no collisions", () => {
    const bounds = { x: 0, y: 0, z: 0, size: 5 };
    const root = new OctreeNode(bounds, basicCollisionSphereTest, 0, 1);

    const object1 = {
      name: "box1",
      getBounds: () => ({ x: 1, y: 1, z: 1, size: 0.2 }),
    };
    const object2 = {
      name: "box2",
      getBounds: () => ({ x: -1, y: -1, z: -1, size: 0.2 }),
    };

    root.insert(object1);
    root.insert(object2);

    const { collisions } = root.checkCollisions();
    expect(collisions.length).toBe(0);
  });

  it("works for many collisions", () => {
    const bounds = { x: 0, y: 0, z: 0, size: 10 };
    const root = new OctreeNode(bounds, basicCollisionSphereTest, 0, 1);
    const numObjects = 300;
    // using random int so we expect some collisions
    for (let i = 0; i < numObjects; ++i) {
      root.insert({
        name: `box${i}`,
        getBounds: () => ({
          x: getRandomInt(-5, 5),
          y: getRandomInt(-5, 5),
          z: getRandomInt(-5, 5),
          size: 0.2,
        }),
      });
    }

    const { collisions } = root.checkCollisions();
    expect(collisions.length).toBeGreaterThanOrEqual(1);
  });
});
