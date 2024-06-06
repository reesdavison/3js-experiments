import { expect } from "vitest";

export function expectVectorClose(value, correct, absTol = 0.01) {
  expect(value).toHaveLength(correct.length);

  try {
    correct.forEach((cor, index) => {
      if (!(cor - absTol <= value[index] && value[index] <= cor + absTol)) {
        throw new Error("Outside tolerance");
      }
    });
  } catch (error) {
    console.trace();
    throw new Error(`Correct answer ${correct}, but given ${value}`);
  }
}

export function expect3x3Matrix(matrix) {
  expect(matrix).toHaveLength(3);
  expect(matrix[0]).toHaveLength(3);
  expect(matrix[1]).toHaveLength(3);
  expect(matrix[2]).toHaveLength(3);
}

export function expect3x3MatrixClose(value, correct) {
  expect3x3Matrix(value);
  expect3x3Matrix(correct);

  try {
    correct.forEach((row, i) => {
      row.forEach((cor, j) => {
        expect(value[i][j]).toBeCloseTo(cor);
      });
    });
  } catch (error) {
    throw new Error(`Correct answer ${correct}, but given ${value}`);
  }
}
