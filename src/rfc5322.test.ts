import { describe, it } from "node:test";
import {
  FWS,
  addrSpec,
  angleAddr,
  atLeast1WSP,
  currAngleAdder,
  mailbox,
  nWSP_CRLF,
  onWSP_CRLF_mWSP,
  nameAddr,
} from "./rfc5322";
// import { atLeast } from "./parser-utils";
// import * as p from "parjs";
// import * as c from "parjs/combinators";

import assert from "node:assert";
import { WSP, crlf } from "./rfc5234";
import { isOkCases } from "./fixture/mod";

describe("rfc5232", (t) => {
  it("atLeast1WSP", () => {
    const parser = atLeast1WSP;
    isOkCases([
      ["", false],
      [" ", true],
      ["  ", true],
      ["  x", false],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  it("nWSP_CRLF", () => {
    const parser = nWSP_CRLF;
    isOkCases([
      [``, false],
      [` `, false],
      [crlf, true],
      [` ${crlf}`, true],
      [`  ${crlf}`, true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  it("onWSP_CRLF_mWSP", () => {
    const parser = onWSP_CRLF_mWSP;
    isOkCases([
      // [` `, false],
      // [crlf, false],
      // [`${crlf}`, false],
      // [` ${crlf}`, false],
      [" ", true],
      // ["  ", true],
      // [` ${crlf} `, true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(
        res.isOk,
        k.output,
        JSON.stringify({ case: k, res }, null, 2)
      );
    });
  });

  it("addr-spec", () => {
    const parser = addrSpec;
    isOkCases([["aaa@bbb.com", true]]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });

  it("WSP", () => {
    const parser = WSP;
    isOkCases([
      [" ", true],
      [String.fromCharCode(0x09), true],
      ["\n", false],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify({ case: k, res }));
    });
  });

  // it("double whitespace", () => {
  //   const parser = FWS;
  //   isOkCases([["  ", true]]).forEach((k) => {
  //     const res = parser.parse(k.input);
  //     assert.equal(res.isOk, k.output, JSON.stringify({ case: k, res }));
  //   });
  // });

  it("FWS", () => {
    const parser = FWS;
    isOkCases([
      [" ", true],
      ["  ", true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify({ case: k, res }));
    });
  });

  it("curr-angle-addr", () => {
    const parser = currAngleAdder;
    isOkCases([
      ["\n<b@c>\n", true],
      ["<b@c>", true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify({ case: k, res }));
    });
  });

  it("angle-addr", () => {
    const parser = angleAddr;
    isOkCases([
      // ["<b@c>", true],
      ["<b@d", true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify({ case: k, res }));
    });
  });

  it("name-addr", () => {
    const parser = nameAddr;
    isOkCases([
      ["a<b@c>", true],
      ["a<b@bar.com>", true],
      ["a   <b@c>", false],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify({ case: k, res }));
    });
  });

  it("mailbox", () => {
    const parser = mailbox;
    isOkCases([
      // ["", false],
      // ["a", false],
      // ["a@", false],
      // ["a@b", false],
      // ["a@b.", false],
      // ["a@b.c", true],
      ["a<x@y.com>", true],
      ["aaa@bbb.com", true],
    ]).forEach((k) => {
      const res = parser.parse(k.input);
      assert.equal(res.isOk, k.output, JSON.stringify(k));
    });
  });
});
