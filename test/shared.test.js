import { describe, expect, it } from "vitest";

import {
  pointInTetrahedron,
  resolvePosition,
  resolveVelocity,
  rotateVectorArray,
} from "../src/library/collision";
import { supportSphere } from "../src/library/sphere";
import { supportCuboid, createBox } from "../src/library/box";
import { pointInTetrahedron } from "../src/library/collision";
import {
  invertVector,
  normaliseVec,
  rotateVectorArray,
} from "../src/library/vector";

import { expectVectorClose } from "./testHelpers";

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
      obj1,
      obj2,
    };
    expect(collision.obj1Closest).toStrictEqual([1, 0, 0]);
    expect(collision.obj2Closest).toStrictEqual([0.5, 0, 0]);
    resolvePosition(collision);
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
      obj1,
      obj2,
    };
    const val = Math.sqrt(0.5);
    expect(collision.obj1Closest).toStrictEqual([val, val, 0]);
    expect(collision.obj2Closest).toStrictEqual([1 - val, 1 - val, 0]);
    resolvePosition(collision);
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
      obj1,
      obj2,
    };
    expect(collision.obj1Closest).toStrictEqual([1, 0, 0]);
    expect(collision.obj2Closest).toStrictEqual([0.5, 0, 0]);
    resolveVelocity(collision);
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
      obj1,
      obj2,
    };
    const val = Math.sqrt(0.5);
    expect(collision.obj1Closest).toStrictEqual([val, val, 0]);
    expect(collision.obj2Closest).toStrictEqual([1 - val, 1 - val, 0]);
    resolveVelocity(collision);
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
      obj1,
      obj2,
    };
    expect(collision.obj1Closest).toStrictEqual([1, 0, 0]);
    expect(collision.obj2Closest).toStrictEqual([0.5, 0, 0]);
    resolveVelocity(collision);
    expectVectorClose(obj1.velocity, [0.96039, 0, 0]);
    expectVectorClose(obj2.velocity, [2.96039, 0, 0]);
  });
});
