import { FailureInfo, ResultKind } from "parjs";
import * as p from "parjs";
import * as c from "parjs/combinators";

// next impl, use a CSParser, and flatten only on success
// type CascadingString = string | CascadingString[];
// const x: CascadingString = "sup";
// const x1: CascadingString = ["sup"];
// const x2: CascadingString = [["sup"]];
// const x3: CascadingString = [x2, x2];
// export type CSParser = p.Parjser<CascadingString>;
// export const maybeCs = (x: CSParser) => x.pipe(c.many());

export const failHard = (reason: string): FailureInfo => ({
  reason,
  kind: ResultKind.HardFail,
});

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

export const flatString = c.map((x: string[]) =>
  x.length === 1 ? x[0]! : x.join("")
);

export const intrange = (start: number, stop: number, exclusive = false) => {
  const len = stop - start;
  return [...new Array(len + (exclusive ? 0 : 1))].map((_, i) => i + start);
};

export const maybe = (x: p.Parjser<string>) =>
  x.pipe(
    c.maybe(),
    c.map(() => "")
  );

export const wrapped = (
  pre: p.Parjser<string>,
  x: p.Parjser<string>,
  post: p.Parjser<string>
) => pre.pipe(c.then(x, post)).pipe(flatString);

export const parenWrapped = (x: p.Parjser<string>) =>
  p.string("(").pipe(c.then(x, p.string(")")), flatString);
// const cases = ["()", "(a)"];
// cases.forEach((k) => console.log(parenWrapped(p.anyChar()).parse(k)));

export const pOfCode = (n: number) =>
  p.charCodeWhere((x) => (x === n ? true : failSoft("char")));

export const charOfCode = (n: number) => String.fromCharCode(n);

export const pCharInRanges = (...ns: [start: number, end: number][]) =>
  p.anyCharOf(
    ns.flatMap(([start, end]) => intrange(start, end).map(charOfCode)).join("")
  );

export const por2 = <T extends p.Parjser<any>>(t0: T, t1: T): T =>
  t0.pipe(c.or(t1)) as T;

export const por3 = <T extends p.Parjser<any>>(t0: T, t1: T, t2: T): T =>
  t0.pipe(c.or(t1), c.or(t2)) as T;

export const maybeThen = (p1: p.Parjser<string>, p2: p.Parjser<string>) =>
  p1.pipe(c.maybe("")).pipe(c.then(p2), flatString);

export const seq2 = (p1: p.Parjser<string>, p2: p.Parjser<string>) =>
  p1.pipe(c.then(p2), flatString);

export const seq3 = (
  p1: p.Parjser<string>,
  p2: p.Parjser<string>,
  p3: p.Parjser<string>
) => seq2(p1, p2).pipe(c.then(p3), flatString);

export const seq4 = (
  p1: p.Parjser<string>,
  p2: p.Parjser<string>,
  p3: p.Parjser<string>,
  p4: p.Parjser<string>
) => seq3(p1, p2, p3).pipe(c.then(p4), flatString);

export const many = <T extends p.Parjser<string>>(t: T) =>
  t.pipe(c.many(), flatString);
