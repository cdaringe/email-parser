import * as p from "parjs";
import * as c from "parjs/combinators";
import { failSoft, flatString } from "./parser-utils";
/**
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1}
 *
 * ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
 *
 * BIT            =  "0" / "1"
 *
 * CHAR           =  %x01-7F
 *                        ; any 7-bit US-ASCII character,
 *                        ;  excluding NUL
 * CR             =  %x0D
 *                        ; carriage return
 *
 * CRLF           =  CR LF
 *                        ; Internet standard newline
 *
 * CTL            =  %x00-1F / %x7F
 *                        ; controls
 *
 * DIGIT          =  %x30-39
 *                        ; 0-9
 *
 * DQUOTE         =  %x22
 *                        ; " (Double Quote)
 *
 * HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
 *
 * HTAB           =  %x09
 *                        ; horizontal tab
 *
 * LF             =  %x0A
 *                        ; linefeed
 *
 * LWSP           =  *(WSP / CRLF WSP)
 *                        ; Use of this linear-white-space rule
 *                        ;  permits lines containing only white
 *                        ;  space that are no longer legal in
 *                        ;  mail headers and have caused
 *                        ;  interoperability problems in other
 *                        ;  contexts.
 *                        ; Do not use when defining mail
 *                        ;  headers and use with caution in
 *                        ;  other contexts.
 *
 * OCTET          =  %x00-FF
 *                        ; 8 bits of data
 *
 * SP             =  %x20
 *
 * VCHAR          =  %x21-7E
 *                        ; visible (printing) characters
 *
 * WSP            =  SP / HTAB
 *                        ; white space
 */

export const ALPHA = p.charCodeWhere((x) =>
  x >= 65 && x <= 122 ? true : failSoft("invalid ALPHA")
);

export const BIT = p.charWhere((x) =>
  x === "0" || x === "1" ? true : failSoft("invalid BIT")
);

export const CHAR = p.charCodeWhere((x) =>
  x >= 0x01 && x <= 0x7f ? true : failSoft("invalid CHAR")
);

export const CR = p.charCodeWhere((x) =>
  x === 0x0d ? true : failSoft("invalid CR")
);

export const LF = p.charCodeWhere((x) =>
  x === 0x0a ? true : failSoft("invalid LF")
);

export const CRLF = CR.pipe(c.then(LF), flatString);
export const crlf = "\r\n";

const _CTL_A = p.charCodeWhere((x) =>
  x >= 0x00 && x <= 0x1f ? true : failSoft("invalid CTL")
);

const _CTL_B = p.charCodeWhere((x) =>
  x === 0x7f ? true : failSoft("invalid CTL")
);

export const CTL = _CTL_A.pipe(c.or(_CTL_B));
// const cases = ["", String.fromCharCode(0x00), "2", "c"];
// cases.forEach((x) => console.log(`input: ${x}`, CTL.parse(x)));

export const DIGIT = p.digit(10);

export const DQUOTE = p.string('"');

export const HEXDIG = DIGIT.pipe(c.then(p.anyCharOf("ABCDEF")));
// console.log(`input: ${x}`, [
//   HEXDIG.parse("0F"),
//   HEXDIG.parse("1F"),
//   HEXDIG.parse("no"),
//   HEXDIG.parse(""),
// ]);

export const HTAB = p.charCodeWhere((x) =>
  x === 0x09 ? true : failSoft("invalid HTAB")
);

export const OCTET = p.charCodeWhere((x) =>
  x >= 0x00 && x <= 0xff ? true : failSoft("OCTET")
);

export const SP = p.charCodeWhere((x) =>
  x === 0x20 ? true : failSoft("invalid SP")
);

export const VCHAR = p.charCodeWhere((x) =>
  x >= 0x21 && x <= 0x7e ? true : failSoft("VCHAR")
);

export const WSP = SP.pipe(c.or(HTAB));
// const cases = ["", String.fromCharCode(0x00), "2", "c", " "];
// cases.forEach((x) => console.log(`input: ${x}`, WSP.parse(x)));

const _CRLF_WSP = CRLF.pipe(c.then(WSP), flatString);
export const LWSP = WSP.pipe(c.or(_CRLF_WSP)).pipe(c.many());
// const cases = [
//   "", // true (many includes 0 iters)
//   "\t \t\n", // fail, \n is not crlf or wsp
//   " ", // pass
//   "  ", // pass
//   "\t ", // pass
//   "\t \t", // pass
// ];
// cases.forEach((x) => console.log(`input: "${x}"`, LWSP.parse(x)));
