export const isOkCases = (xs: [input: string, output: boolean][]) =>
  xs.map(([input, output]) => ({
    input,
    output,
  }));
