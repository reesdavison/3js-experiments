import {
  directionToOrigin,
  vecToString,
  supportSphere,
  pointInTetrahedron,
  normalToOrigin,
  invertVector,
  resolvePosition,
  normaliseVec,
  resolveVelocity,
  supportCuboid,
  rotateVectorArray,
  rotateVectorAngleAxis,
  getCuboidCorners,
  gjkIntersection,
} from "../src/js/shared";

import { describe, expect, it } from "vitest";

import { expectVectorClose } from "./testHelpers";

describe("direction to origin", () => {
  it("gives direction -0.5,-0.5 with unit coordinates", () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const simplex = new Set([vecToString(vec1), vecToString(vec2)]);
    const { direction: vec3, containsOrigin } = directionToOrigin(simplex);
    expect(containsOrigin).toBeFalsy();
    const norm = Math.sqrt(0.5 ** 2 + 0.5 ** 2);
    expect(vec3[0]).toBeCloseTo(-0.5 / norm);
    expect(vec3[1]).toBeCloseTo(-0.5 / norm);
    expect(vec3[2]).toBeCloseTo(0);
  });

  it("gives direction -0.5,-0.5 with non unit coordinates", () => {
    const vec1 = [2, -1, 0];
    const vec2 = [-1, 2, 0];
    const simplex = new Set([vecToString(vec1), vecToString(vec2)]);
    const { direction: vec3, containsOrigin } = directionToOrigin(simplex);
    expect(containsOrigin).toBeFalsy();
    const norm = Math.sqrt(0.5 ** 2 + 0.5 ** 2);
    expect(vec3[0]).toBeCloseTo(-0.5 / norm);
    expect(vec3[1]).toBeCloseTo(-0.5 / norm);
    expect(vec3[2]).toBeCloseTo(0);
  });

  it("simplex line through origin", () => {
    const simplex = new Set([
      "2.220446049250313e-15,0,0",
      "-2.999999999999998,0,0",
    ]);
    const { direction: vec3, containsOrigin } = directionToOrigin(simplex);
    expect(containsOrigin).toBeTruthy();
    expectVectorClose(vec3, [1, 0, 0]);
  });
});

describe("support sphere", () => {
  it("gives the correct support right", () => {
    const sphere1 = {
      radius: 5,
      position: [1, 1, 1],
    };
    const direction = [1, 0, 0];
    const support = supportSphere(sphere1, direction);
    expect(support).toStrictEqual([6, 1, 1]);
  });

  it("gives the correct support left", () => {
    const sphere1 = {
      radius: 5,
      position: [1, 1, 1],
    };
    const direction = [-1, 0, 0];
    const support = supportSphere(sphere1, direction);
    expect(support).toStrictEqual([-4, 1, 1]);
  });

  it("gives the correct support down", () => {
    const sphere1 = {
      radius: 5,
      position: [1, 1, 1],
    };
    const direction = [0, -1, 0];
    const support = supportSphere(sphere1, direction);
    expect(support).toStrictEqual([1, -4, 1]);
  });

  it("gives the correct support at 45 degree angle", () => {
    const sphere1 = {
      radius: 5,
      position: [1, 1, 1],
    };
    const direction = [1, 1, 0];
    const support = supportSphere(sphere1, direction);

    // 5^2 = a^2 + b^2, when a = b and solve
    const val = Math.sqrt(5 ** 2 / 2);
    expect(support).toStrictEqual([1 + val, 1 + val, 1]);
  });
});

describe("point inside tetrahedron", () => {
  it("returns true for simple case", () => {
    const vec1 = [0, 0, 0];
    const vec2 = [10, 0, 0];
    const vec3 = [0, 10, 0];
    const vec4 = [0, 0, 10];
    const p1 = [2, 2, 2];
    const inside = pointInTetrahedron(vec1, vec2, vec3, vec4, p1);
    expect(inside).toBeTruthy();
  });

  it("returns false for simple case", () => {
    const vec1 = [0, 0, 0];
    const vec2 = [10, 0, 0];
    const vec3 = [0, 10, 0];
    const vec4 = [0, 0, 10];
    const p1 = [-1, -1, -1];
    const inside = pointInTetrahedron(vec1, vec2, vec3, vec4, p1);
    expect(inside).toBeFalsy();
  });
});

describe("normal towards origin of plane", () => {
  it("returns true for simple case", () => {
    const vec1 = [10, 0, 0];
    const vec2 = [0, 10, 0];
    const vec3 = [0, 0, 10];

    const simplex = new Set([
      vecToString(vec1),
      vecToString(vec2),
      vecToString(vec3),
    ]);
    const direction = normalToOrigin(simplex);
    const norm = Math.sqrt(3);
    expect(direction[0]).toBeCloseTo(-1 / norm);
    expect(direction[1]).toBeCloseTo(-1 / norm);
    expect(direction[2]).toBeCloseTo(-1 / norm);
  });

  it("breaks currently", () => {
    const simplex = new Set([
      "0.540,-1,0",
      "-1.6727,0.3198,0",
      "-0.1915,0.2882,0",
    ]);
    //{'0.3400000000000025,-1,0', '-1.642854099858054,0.4201591172295682,0', '-0.2865817582014547,0.21948373293518864,0', '-1.1599999999999975,-1,1.5'}
    const direction = normalToOrigin(simplex);
    // foo
    direction;
  });
});

describe("resolve position", () => {
  it("works with objects travelling along same dimension", () => {
    const normal = [1, 0, 0];
    const obj1 = {
      mass: 1,
      position: [0, 0, 0],
      radius: 1,
    };
    const obj2 = {
      mass: 1,
      position: [1.5, 0, 0],
      radius: 1,
    };
    const collision = {
      collide: true,
      normal: [1, 0, 0],
      obj1Closest: supportSphere(obj1, normal),
      obj2Closest: supportSphere(obj2, invertVector(normal)),
    };
    expect(collision.obj1Closest).toStrictEqual([1, 0, 0]);
    expect(collision.obj2Closest).toStrictEqual([0.5, 0, 0]);
    resolvePosition(collision, obj1, obj2);
    expect(obj1.position).toStrictEqual([-0.25, 0, 0]); // -> 0.25 left
    expect(obj2.position).toStrictEqual([1.75, 0, 0]); // <- 0.25 right
  });

  it("works with objects along y=x", () => {
    const normal = normaliseVec([1, 1, 0]);
    const obj1 = {
      mass: 1,
      position: [0, 0, 0],
      radius: 1,
    };
    const obj2 = {
      mass: 1,
      position: [1, 1, 0],
      radius: 1,
    };
    const collision = {
      collide: true,
      normal: normal,
      obj1Closest: supportSphere(obj1, normal),
      obj2Closest: supportSphere(obj2, invertVector(normal)),
    };
    const val = Math.sqrt(0.5);
    expect(collision.obj1Closest).toStrictEqual([val, val, 0]);
    expect(collision.obj2Closest).toStrictEqual([1 - val, 1 - val, 0]);
    resolvePosition(collision, obj1, obj2);
    expect(obj1.position[0]).toStrictEqual(obj1.position[1]);
    expect(obj1.position[0]).toBeCloseTo(-0.20710678);
    expect(obj2.position[0]).toStrictEqual(obj2.position[1]);
    expect(obj2.position[0]).toBeCloseTo(1.20710678);
  });
});

describe("resolve velocity", () => {
  it("works with objects travelling along same dimension", () => {
    const normal = [1, 0, 0];
    const obj1 = {
      mass: 1,
      position: [0, 0, 0],
      velocity: [1, 0, 0],
      radius: 1,
    };
    const obj2 = {
      mass: 1,
      position: [1.5, 0, 0],
      velocity: [-1, 0, 0],
      radius: 1,
    };
    const collision = {
      collide: true,
      normal: [1, 0, 0],
      obj1Closest: supportSphere(obj1, normal),
      obj2Closest: supportSphere(obj2, invertVector(normal)),
    };
    expect(collision.obj1Closest).toStrictEqual([1, 0, 0]);
    expect(collision.obj2Closest).toStrictEqual([0.5, 0, 0]);
    resolveVelocity(collision, obj1, obj2);
    expect(obj1.velocity).toStrictEqual([-1, 0, 0]);
    expect(obj2.velocity).toStrictEqual([1, 0, 0]);
  });

  it("works with objects along y=x", () => {
    const normal = normaliseVec([1, 1, 0]);
    const obj1 = {
      mass: 1,
      position: [0, 0, 0],
      velocity: [1, 1, 0],
      radius: 1,
    };
    const obj2 = {
      mass: 1,
      position: [1, 1, 0],
      velocity: [-1, -1, 0],
      radius: 1,
    };
    const collision = {
      collide: true,
      normal: normal,
      obj1Closest: supportSphere(obj1, normal),
      obj2Closest: supportSphere(obj2, invertVector(normal)),
    };
    const val = Math.sqrt(0.5);
    expect(collision.obj1Closest).toStrictEqual([val, val, 0]);
    expect(collision.obj2Closest).toStrictEqual([1 - val, 1 - val, 0]);
    resolveVelocity(collision, obj1, obj2);
    expect(obj1.velocity[0]).toStrictEqual(obj1.velocity[1]);
    expect(obj1.velocity[0]).toBeCloseTo(-1);
    expect(obj2.velocity[0]).toStrictEqual(obj2.velocity[1]);
    expect(obj2.velocity[0]).toBeCloseTo(1);
  });

  it("works with objects travelling along same dimension, obj1 much greater mass", () => {
    const normal = [1, 0, 0];
    const obj1 = {
      mass: 100,
      position: [0, 0, 0],
      velocity: [1, 0, 0],
      radius: 1,
    };
    const obj2 = {
      mass: 1,
      position: [1.5, 0, 0],
      velocity: [-1, 0, 0],
      radius: 1,
    };
    const collision = {
      collide: true,
      normal: [1, 0, 0],
      obj1Closest: supportSphere(obj1, normal),
      obj2Closest: supportSphere(obj2, invertVector(normal)),
    };
    expect(collision.obj1Closest).toStrictEqual([1, 0, 0]);
    expect(collision.obj2Closest).toStrictEqual([0.5, 0, 0]);
    resolveVelocity(collision, obj1, obj2);
    expectVectorClose(obj1.velocity, [0.96039, 0, 0]);
    expectVectorClose(obj2.velocity, [2.96039, 0, 0]);
  });
});

describe("support cuboid works as expected", () => {
  const unitCube = {
    corners: [
      [1, 1, 1],
      [-1, 1, 1],
      [1, -1, 1],
      [1, 1, -1],
      [-1, -1, 1],
      [1, -1, -1],
      [-1, 1, -1],
      [-1, -1, -1],
    ],
    position: [0, 0, 0],
    support: supportCuboid,
  };

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
    const direction = [1, 0, 0];
    const angle = 50 * (Math.PI / 180); // 30 degrees
    const cube = {
      corners: rotateVectorArray(unitCube.corners, [0, 0, 1], angle),
      position: [0, 0, 0],
      support: supportCuboid,
    };
    const intersect = supportCuboid(cube, direction);
    // should still be along x axis
    expectVectorClose(intersect, [1.408, 0.123, 1]);
  });
});
