import * as c from "parjs/combinators";
import * as p from "parjs";
import { FailureInfo, ResultKind } from "parjs";

// prep some utility fns
export const flatString = c.map((x: string[]) =>
  x.length === 1 ? x[0]! : x.join("")
);

export const failSoft = (reason: string): FailureInfo => ({
  reason,
  kind: ResultKind.SoftFail,
});

export const atLeast = (n: number, t: p.Parjser<string>) =>
  t.pipe(
    c.exactly<string>(n),
    flatString,
    c.then(t.pipe(c.many(), flatString)),
    flatString
  );

// grammar parser
export const CR = p.charCodeWhere((x) =>
  x === 0x0d ? true : failSoft("invalid CR")
);
export const LF = p.charCodeWhere((x) =>
  x === 0x0a ? true : failSoft("invalid LF")
);
export const SP = p.charCodeWhere((x) => (x === 0x20 ? true : failSoft("SP")));
export const CRLF = CR.pipe(c.then(LF), flatString);
export const HTAB = p.charCodeWhere((x) =>
  x === 0x09 ? true : failSoft("HTAB")
);
export const WSP = SP.pipe(c.or(HTAB));

// *WSP CRLF
export const nWSP_CRLF = WSP.pipe(
  c.many(),
  flatString,
  c.then(CRLF),
  flatString
);

export const atLeast1WSP = atLeast(1, WSP);

// ([*WSP CRLF] 1*WSP)
export const onWSP_CRLF_mWSP = nWSP_CRLF.pipe(
  c.maybe(),
  c.map(() => ""),
  c.then(atLeast1WSP), // everything above _should_ have been maybe'd, but hard fails
  flatString
);

// let's parse a single piece of whitespace!
console.log(onWSP_CRLF_mWSP.parse(" "));
