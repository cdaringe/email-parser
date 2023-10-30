import { ALPHA, CR, CRLF, DIGIT, DQUOTE, LF, VCHAR, WSP } from "./rfc5234";
import * as c from "parjs/combinators";
import * as p from "parjs";
import {
  atLeast,
  charOfCode,
  failSoft,
  flatString,
  intrange,
  many,
  maybe,
  maybeThen,
  pCharInRanges,
  pOfCode,
  parenWrapped,
  por2,
  por3,
  seq2,
  seq3,
  seq4,
  wrapped,
} from "./parser-utils";

/**
 * @see {@link ...}
 * obs-NO-WS-CTL   =   %d1-8 /            ; US-ASCII control
 *                     %d12 /             ;  include the carriage
 *                     %d11 /             ;  characters that do not
 *                     %d127              ;  white space characters
 *                     %d14-31 /          ;  return, line feed, and
 * obs-ctext       =   obs-NO-WS-CTL
 *
 * obs-qtext       =   obs-NO-WS-CTL
 *
 * obs-utext       =   %d0 / obs-NO-WS-CTL / VCHAR
 *
 * obs-qp          =   "\" (%d0 / obs-NO-WS-CTL / LF / CR)
 *
 * obs-body        =   *((*LF *CR *((%d0 / text) *LF *CR)) / CRLF)
 *
 * obs-unstruct    =   *((*LF *CR *(obs-utext *LF *CR)) / FWS)
 */

const _obsNOWSCTL = new Set(
  [...intrange(1, 8), 11, 12, ...intrange(14, 31), 127].map((i) =>
    String.fromCharCode(i)
  )
);

export const obsNOWSCTL = p.anyChar().pipe(
  c.must((x) => (_obsNOWSCTL.has(x) ? true : failSoft("obsNOWSCTL"))),
  c.map(String)
);

export const obsCtext = obsNOWSCTL;
export const obsQtext = obsNOWSCTL;

//  * obs-qp          =   "\" (%d0 / obs-NO-WS-CTL / LF / CR)
export const obsQp = p
  .string("\\")
  .pipe(
    c.then(
      p
        .string(String.fromCharCode(0))
        .pipe(c.or(obsNOWSCTL), c.or(LF), c.or(CR))
    ),
    flatString
  );

// * obs-utext       =   %d0 / obs-NO-WS-CTL / VCHAR
const obsUtext = pOfCode(0).pipe(c.or(obsNOWSCTL), c.or(VCHAR));

/**
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.1}
 * quoted-pair     =   ("\" (VCHAR / WSP)) / obs-qp
 */
const _VCHAR_OR_WSP = VCHAR.pipe(c.or(WSP));
export const quotedPair = p
  .string("\\")
  .pipe(c.then(_VCHAR_OR_WSP), flatString)
  .pipe(c.or(obsQp));

export const obsDtext = por2(obsNOWSCTL, quotedPair);

/**
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.2}
 * FWS             =   ([*WSP CRLF] 1*WSP) /  obs-FWS
 *                     ; Folding white space
 *
 * ctext           =   %d33-39 /          ; Printable US-ASCII
 *                     %d42-91 /          ;  characters not including
 *                     %d93-126 /         ;  "(", ")", or "\"
 *                     obs-ctext
 *
 * ccontent        =   ctext / quoted-pair / comment
 *
 * comment         =   "(" *([FWS] ccontent) [FWS] ")"
 *
 * CFWS            =   (1*([FWS] comment) [FWS]) / FWS
 */

export const atLeast1WSP = atLeast(1, WSP);

// obs-FWS         =   1*WSP *(CRLF 1*WSP)
/// CRLF 1*WSP
const _CRLF_1N_WSP = CRLF.pipe(c.then(atLeast1WSP), flatString);
export const obsFWS = atLeast1WSP.pipe(
  c.then(_CRLF_1N_WSP.pipe(c.many(), flatString)),
  flatString
);

// * FWS             =   ([*WSP CRLF] 1*WSP) /  obs-FWS

// *WSP CRLF
export const nWSP_CRLF = WSP.pipe(
  c.many(),
  flatString,
  c.then(CRLF),
  flatString
);

// ([*WSP CRLF] 1*WSP)
export const onWSP_CRLF_mWSP = nWSP_CRLF.pipe(
  c.maybe(),
  c.map(() => ""),
  c.then(atLeast1WSP),
  flatString
);

// @todo this is the expected one
export const FWS = por2(onWSP_CRLF_mWSP, obsFWS);

// * obs-unstruct    =   *((*LF *CR *(obs-utext *LF *CR)) / FWS)
// *(obs-utext *LF *CR)
const _obsutextlfcr = obsUtext
  .pipe(
    c.then(LF.pipe(c.many(), flatString), CR.pipe(c.many(), flatString)),
    flatString
  )
  .pipe(c.many(), flatString);
// (*LF *CR *(obs-utext *LF *CR)
const _lfcrobsblock = LF.pipe(
  c.many(),
  flatString,
  c.then(CR.pipe(c.many(), flatString)),
  flatString,
  c.then(_obsutextlfcr.pipe(c.many(), flatString)),
  flatString
);

export const obsUnstruct = _lfcrobsblock
  .pipe(c.or(FWS))
  .pipe(c.many(), flatString);

// * ctext           =   %d33-39 /          ; Printable US-ASCII
// *                     %d42-91 /          ;  characters not including
// *                     %d93-126 /         ;  "(", ")", or "\"
// *                     obs-ctext

const _ctextCharsString = String.fromCharCode(
  ...[...intrange(33, 39), ...intrange(42, 91), ...intrange(93, 126)]
);

export const ctext = p.anyCharOf(_ctextCharsString).pipe(c.or(obsCtext));

export const ccontent = c.later<string>();

// * comment         =   "(" *([FWS] ccontent) [FWS] ")"
/// [FWS] ccontent
const _FWS_ccontent = FWS.pipe(c.maybe(""), c.then(ccontent), flatString);
/// *([FWS] ccontent)
const _n_FWS_ccontent = _FWS_ccontent.pipe(c.many(), flatString);
///  "(" *([FWS] ccontent) [FWS] ")"
export const comment = parenWrapped(
  _n_FWS_ccontent.pipe(c.then(FWS)).pipe(flatString)
);

// * ccontent        =   ctext / quoted-pair / comment
ccontent.init(ctext.pipe(c.or(quotedPair), c.or(comment)));

// * CFWS            =   (1*([FWS] comment) [FWS]) / FWS
const _maybe_FWS = FWS.pipe(c.maybe(""));
const _FWS_comment = atLeast(
  1,
  _maybe_FWS.pipe(c.then(comment), flatString)
).pipe(c.then(_maybe_FWS), flatString);
export const CFWS = _FWS_comment.pipe(c.or(FWS));
export const wrappedCFWS = (t: p.Parjser<string>) => wrapped(CFWS, t, CFWS);
export const wrappedMaybeCFWS = (t: p.Parjser<string>) =>
  wrapped(_maybe_CWFS, t, _maybe_CWFS);

/**
 * @see {@link }
 * atext           =   ALPHA / DIGIT /    ; Printable US-ASCII
 *                     "!" / "#" /        ;  characters not including
 *                     "$" / "%" /        ;  specials.  Used for atoms.
 *                     "&" / "'" /
 *                     "*" / "+" /
 *                     "-" / "/" /
 *                     "=" / "?" /
 *                     "^" / "_" /
 *                     "`" / "{" /
 *                     "|" / "}" /
 *                     "~"
 *
 * atom            =   [CFWS] 1*atext [CFWS]
 *
 * dot-atom-text   =   1*atext *("." 1*atext)
 *
 * dot-atom        =   [CFWS] dot-atom-text [CFWS]
 *
 * specials        =   "(" / ")" /        ; Special characters that do
 *                     "<" / ">" /        ;  not appear in atext
 *                     "[" / "]" /
 *                     ":" / ";" /
 *                     "@" / "\" /
 *                     "," / "." /
 *                     DQUOTE
 */

export const atext = ALPHA.pipe(
  c.or(DIGIT, p.anyCharOf("!$&*-=^`|~#%'+/?_{}"))
);

// * atom            =   [CFWS] 1*atext [CFWS]
const atLeast1Atext = atLeast(1, atext);
export const atom = wrapped(maybe(CFWS), atLeast1Atext, maybe(CFWS));

// * dot-atom-text   =   1*atext *("." 1*atext)
const _dotAtext = p.string(".").pipe(c.then(atLeast1Atext), flatString);
export const dotAtomText = atLeast1Atext.pipe(
  c.then(_dotAtext.pipe(c.many(), flatString)),
  flatString
);

// * specials        =   "(" / ")" /        ; Special characters that do
// *                     "<" / ">" /        ;  not appear in atext
// *                     "[" / "]" /
// *                     ":" / ";" /
// *                     "@" / "\" /
// *                     "," / "." /
// *                     DQUOTE
export const specials = p.anyCharOf("(<[:@,)>];\\.").pipe(c.or(DQUOTE));

/**
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.4}
 *
 * qtext           =   %d33 /             ; Printable US-ASCII
 *                       %d35-91 /          ;  characters not including
 *                       %d93-126 /         ;  "\" or the quote character
 *                       obs-qtext
 *
 * qcontent        =   qtext / quoted-pair
 *
 * quoted-string   =   [CFWS]
 *                       DQUOTE *([FWS] qcontent) [FWS] DQUOTE
 *                       [CFWS]
 */
const _qtextCharString = [33, ...intrange(35, 91), ...intrange(93, 126)]
  .map((x) => String.fromCharCode(x))
  .join("");

const qtext = p.anyCharOf(_qtextCharString).pipe(c.or(obsQtext));

const qcontent = qtext.pipe(c.or(quotedPair));

const _maybe_CWFS = CFWS.pipe(c.maybe(""));
// *([FWS] qcontent) [FWS]
const _maybe_FWS_qcontent = _maybe_FWS
  .pipe(c.then(qcontent), flatString)
  .pipe(c.many(), flatString)
  .pipe(c.then(_maybe_FWS), flatString);

export const dotAtom = wrapped(_maybe_CWFS, dotAtomText, _maybe_CWFS);

export const quotedString = wrapped(
  _maybe_CWFS,
  wrapped(DQUOTE, _maybe_FWS_qcontent, DQUOTE),
  _maybe_CWFS
);

/**
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.5}
 *
 * obs-phrase      =   word *(word / "." / CFWS)
 *
 * obs-phrase-list =   [phrase / CFWS] *("," [phrase / CFWS])
 *
 * word            =   atom / quoted-string
 *
 * phrase          =   1*word / obs-phrase
 *
 * unstructured    =   (*([FWS] VCHAR) *WSP) / obs-unstruct
 */

export const word = atom.pipe(c.or(quotedString));

export const obsLocalPart = seq2(word, many(seq2(p.string("."), word)));

export const obsPhrase = word.pipe(
  c.then(word.pipe(c.or(p.string(".")), c.or(CFWS)).pipe(c.many(), flatString)),
  flatString
);

export const phrase = atLeast(1, word).pipe(c.or(obsPhrase));

// * unstructured    =   (*([FWS] VCHAR) *WSP) / obs-unstruct
const _unstructuredOpt1 = _maybe_FWS
  .pipe(c.then(VCHAR), flatString)
  .pipe(c.many(), flatString, c.then(WSP.pipe(c.many(), flatString)));

export const unstructured = _unstructuredOpt1.pipe(c.or(obsUnstruct));

/**
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1}
 * addr-spec       =   local-part "@" domain
 *
 * local-part      =   dot-atom / quoted-string / obs-local-part
 *
 * domain          =   dot-atom / domain-literal / obs-domain
 *
 * domain-literal  =   [CFWS] "[" *([FWS] dtext) [FWS] "]" [CFWS]
 *
 * dtext           =   %d33-90 /          ; Printable US-ASCII
 *                     %d94-126 /         ;  characters not including
 *                     obs-dtext          ;  "[", "]", or "\"
 */
const dtext = pCharInRanges([33, 90], [94, 126]).pipe(c.or(obsDtext));

const localPart = por3(dotAtom, quotedString, obsLocalPart);
export const domainLiteral = wrapped(
  _maybe_CWFS,
  wrapped(
    p.string("["),
    seq2(many(maybeThen(FWS, dtext)), maybe(FWS)),
    p.string("]")
  ),
  _maybe_CWFS
);

/**
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5322#section-4.4}
 * obs-angle-addr  =   [CFWS] "<" obs-route addr-spec ">" [CFWS]
 * obs-route       = obs-domain-list ":"
 * obs-domain-list =   *(CFWS / ",") "@" domain
 *                      *("," [CFWS] ["@" domain])
 * obs-mbox-list   =   *([CFWS] ",") mailbox *("," [mailbox / CFWS])
 * obs-addr-list   =   *([CFWS] ",") address *("," [address / CFWS])
 * obs-group-list  =   1*([CFWS] ",") [CFWS]
 * obs-local-part  =   word *("." word)
 * obs-domain      =   atom *("." atom)
 * obs-dtext       =   obs-NO-WS-CTL / quoted-pair
 */

export const obsDomain = atom.pipe(
  c.then(
    p.string(".").pipe(c.then(atom), flatString).pipe(c.many(), flatString)
  ),
  flatString
);

export const domain = por3(dotAtom, domainLiteral, obsDomain);
export const addrSpec = seq3(localPart, p.string("@"), domain);

export const obsDomainList = seq4(
  many(por2(CFWS, p.string(","))),
  p.string("@"),
  domain,
  many(seq3(p.string(","), maybe(CFWS), maybe(seq2(p.string("@"), domain))))
);

export const obsRoute = seq2(obsDomainList, p.string(":"));

export const obsAngleAddr = wrappedMaybeCFWS(
  wrapped(p.string("<"), seq2(obsRoute, addrSpec), p.string(">"))
);

/**
 * @see {@link https://datatracker.ietf.org/doc/html/rfc5322#section-3.4}
 *
 * address         =   mailbox / group
 *
 * mailbox         =   name-addr / addr-spec
 *
 * name-addr       =   [display-name] angle-addr
 *
 * angle-addr      =   [CFWS] "<" addr-spec ">" [CFWS] /
 *                     obs-angle-addr
 *
 * group           =   display-name ":" [group-list] ";" [CFWS]
 *
 * display-name    =   phrase
 *
 * mailbox-list    =   (mailbox *("," mailbox)) / obs-mbox-list
 *
 * address-list    =   (address *("," address)) / obs-addr-list
 *
 * group-list      =   mailbox-list / CFWS / obs-group-list
 */
export const displayName = phrase;
export const currAngleAdder = wrapped(
  _maybe_CWFS,
  wrapped(p.string("<"), addrSpec, p.string(">")),
  _maybe_CWFS
);
// export const angleAddr = por2(currAngleAdder, obsAngleAddr);
export const angleAddr = currAngleAdder;
export const nameAddr = maybeThen(displayName, angleAddr);
// export const mailbox = por2(addrSpec, nameAddr);
export const mailbox = por2(nameAddr, addrSpec);
