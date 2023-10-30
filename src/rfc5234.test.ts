import { describe, it } from "node:test";
import { isOkCases } from "./fixture/mod";

import assert from "node:assert";
import { CRLF, crlf } from "./rfc5234";

describe("rfc5234", () => {
  it("clrf", () => {
    const parser = CRLF;
    isOkCases([[crlf, true]]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });
});
