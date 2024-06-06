import {
  getBarycentricWeightsOfOriginFromSimplex,
  getPointFromBarycentricWeights,
} from "../src/library/collision";

import { expectVectorClose } from "./testHelpers";

import { describe, expect, it } from "vitest";

describe("barycentric solver", () => {
  it("works for simplex on origin", () => {
    const simplex = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const result = getBarycentricWeightsOfOriginFromSimplex(simplex);
    expectVectorClose(result, [1, 0, 0, 0]);
  });

  it("works for simplex centered on origin", () => {
    const simplex = [
      [-1, -1, -1],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const result = getBarycentricWeightsOfOriginFromSimplex(simplex);
    expectVectorClose(result, [0.25, 0.25, 0.25, 0.25]);
  });
});

describe("point from barycentric weights", () => {
  it("works for case on point", () => {
    const points = [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const weights = [0, 0, 1, 0];
    const result = getPointFromBarycentricWeights(weights, points);
    expectVectorClose(result, [0, 1, 0]);
  });

  it("works for case in center", () => {
    const points = [
      [-1, -1, -1],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const weights = [0.25, 0.25, 0.25, 0.25];
    const result = getPointFromBarycentricWeights(weights, points);
    expectVectorClose(result, [0, 0, 0]);
  });
});
