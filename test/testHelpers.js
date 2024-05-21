import { expect } from "vitest";

export function expectVectorClose(value, correct) {
  expect(value).toHaveLength(correct.length);

  try {
    correct.forEach((cor, index) => {
      expect(value[index]).toBeCloseTo(cor);
    });
  } catch (error) {
    throw new Error(`Correct answer ${correct}, but given ${value}`);
  }
}
