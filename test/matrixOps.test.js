import { expect3x3MatrixClose, expectVectorClose } from "./testHelpers";

import { describe, expect, it } from "vitest";
import {
  invertMatrix,
  multiplyMatrix,
  multiplyVecMatrixVec,
  transpose3x3Matrix,
  rotationMatrixFromAxisAngle,
  multiplyMatrixVec,
  normaliseVec,
} from "../src/library/vector";

describe("matrix multiplication", () => {
  it("works for matrix multipled by identity", () => {
    const matrix1 = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const identity = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const result = multiplyMatrix(matrix1, identity);
    expect3x3MatrixClose(result, matrix1);
  });

  it("works for matrix multipled by its inverse", () => {
    const matrix1 = [
      [1, 1, 1],
      [2, 6, 7],
      [2, 2, 1],
    ];
    const correctInversion = [
      [2, -0.25, -0.25],
      [-3, 0.25, 1.25],
      [2, 0, -1],
    ];
    const identity = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const result = multiplyMatrix(correctInversion, matrix1);
    expect3x3MatrixClose(result, identity);
  });
});

describe("matrix inversion", () => {
  it("works for standard case", () => {
    const matrix1 = [
      [1, 1, 1],
      [2, 6, 7],
      [2, 2, 1],
    ];
    const correctInversion = [
      [2, -0.25, -0.25],
      [-3, 0.25, 1.25],
      [2, 0, -1],
    ];
    const result = invertMatrix(matrix1);
    expect3x3MatrixClose(result, correctInversion);
  });

  it("works for inverse case", () => {
    const matrix1 = [
      [1, 1, 1],
      [2, 6, 7],
      [2, 2, 1],
    ];
    const correctInversion = [
      [2, -0.25, -0.25],
      [-3, 0.25, 1.25],
      [2, 0, -1],
    ];
    const result = invertMatrix(correctInversion);
    expect3x3MatrixClose(result, matrix1);
  });
});

describe("vector matrix vector multiplication", () => {
  it("works for simple case", () => {
    const v1 = [1, 2, 3];
    const identity = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const result = multiplyVecMatrixVec(v1, identity, v1);
    expect(result).toBeCloseTo(14);
  });
});

describe("transpose matrix", () => {
  it("works", () => {
    const m = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const result = transpose3x3Matrix(m);
    expect3x3MatrixClose(result, [
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
    ]);
  });
});

describe("rotation matrix from axis angle", () => {
  it("works for unit y vector rotated 90degrees about x-axis", () => {
    const angle = Math.PI / 2;
    const axis = [1, 0, 0];
    const rotation = rotationMatrixFromAxisAngle(axis, angle);
    // expect3x3MatrixClose(rotation, [
    //   [1, 0, 0],
    //   [0, 0, 1],
    //   [0, 1, 0],
    // ]);
    const result = multiplyMatrixVec(rotation, [0, 1, 0]);
    expectVectorClose(result, [0, 0, 1]);
  });
});
