import { describe, it } from "node:test";
import { atLeast, flatString, many, maybe } from "./parser-utils";
import * as p from "parjs";
import * as c from "parjs/combinators";

import assert from "node:assert";

const isOkCases = (xs: [input: string, output: boolean][]) =>
  xs.map(([input, output]) => ({
    input,
    output,
  }));

describe("parser utils", async (t) => {
  it("or sandbox", () => {
    const parser = p.string("a").pipe(c.or(p.string("b")));
    isOkCases([
      ["a", true],
      ["b", true],
      ["c", false],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  it("maybe sandbox 1", () => {
    const parser = maybe(p.string("a")).pipe(c.then(p.string("b")));
    isOkCases([
      ["ab", true],
      ["b", true],
      ["cb", false],
      ["c", false],
      ["", false],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  it("maybe sandbox 2", () => {
    const parser = p.string("a").pipe(c.maybe(), c.then(p.string(" ")));
    isOkCases([
      ["", false],
      ["a ", true],
      [" ", true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  it("many sandbox - 1", () => {
    const parser = many(p.string("a"));
    isOkCases([
      ["", true],
      ["a", true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  it("many sandbox - 2", () => {
    const parser = many(p.string("abc"));
    isOkCases([
      ["", true],
      ["abcab", false],
      ["abc", true],
      ["abcabc", true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  it("many sandbox - 3", () => {
    const parser = many(
      p.string("ab").pipe(c.then(maybe(p.string("c"))), flatString)
    );
    isOkCases([
      ["", true],
      ["ab", true],
      ["abc", true],
      ["abcab", true],
      ["abcabc", true],
      ["ababc", true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  await describe("atLeast", async () => {
    await it("atLeast - 1", () => {
      const parser = atLeast(1, p.string("a"));
      isOkCases([
        ["", false],
        ["a", true],
        ["aa", true],
        ["aab", false],
        ["b", false],
      ]).forEach((k) => {
        const res = parser.parse(k.input);
        assert.equal(res.isOk, k.output, JSON.stringify(k));
      });
    });

    await it("atLeast - 2", () => {
      const parser = atLeast(2, p.string("a"));
      isOkCases([
        ["a", false],
        ["aa", true],
        ["aaa", true],
        ["aaab", false],
        ["", false],
      ]).forEach((k) => {
        const res = parser.parse(k.input);
        assert.equal(res.isOk, k.output, JSON.stringify(k));
      });
    });
  });
});
