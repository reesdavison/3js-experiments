import {
  directionToOrigin,
  vecToString,
  supportSphere,
  pointInTetrahedron,
} from "../src/js/shared";

import { describe, expect, it } from "vitest";

describe("direction to origin", () => {
  it("gives direction -0.5,-0.5 with unit coordinates", () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const simplex = new Set([vecToString(vec1), vecToString(vec2)]);
    const vec3 = directionToOrigin(simplex);
    expect(vec3[0]).toBeCloseTo(-0.5);
    expect(vec3[1]).toBeCloseTo(-0.5);
    expect(vec3[2]).toBeCloseTo(0);
  });

  it("gives direction -0.5,-0.5 with non unit coordinates", () => {
    const vec1 = [2, -1, 0];
    const vec2 = [-1, 2, 0];
    const simplex = new Set([vecToString(vec1), vecToString(vec2)]);
    const vec3 = directionToOrigin(simplex);
    expect(vec3[0]).toBeCloseTo(-0.5);
    expect(vec3[1]).toBeCloseTo(-0.5);
    expect(vec3[2]).toBeCloseTo(0);
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
