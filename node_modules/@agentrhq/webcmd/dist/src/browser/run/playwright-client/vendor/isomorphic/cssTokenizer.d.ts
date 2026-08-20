export interface CSSTokenInterface {
    toSource(): string;
    value: string | number | undefined;
}
export declare class InvalidCharacterError extends Error {
    constructor(message: string);
}
export declare function tokenize(str1: string): CSSTokenInterface[];
export declare class CSSParserToken implements CSSTokenInterface {
    tokenType: string;
    value: string | number | undefined;
    toJSON(): any;
    toString(): string;
    toSource(): string;
}
export declare class BadStringToken extends CSSParserToken {
    tokenType: string;
}
export declare class BadURLToken extends CSSParserToken {
    tokenType: string;
}
export declare class WhitespaceToken extends CSSParserToken {
    tokenType: string;
    toString(): string;
    toSource(): string;
}
export declare class CDOToken extends CSSParserToken {
    tokenType: string;
    toSource(): string;
}
export declare class CDCToken extends CSSParserToken {
    tokenType: string;
    toSource(): string;
}
export declare class ColonToken extends CSSParserToken {
    tokenType: string;
}
export declare class SemicolonToken extends CSSParserToken {
    tokenType: string;
}
export declare class CommaToken extends CSSParserToken {
    tokenType: string;
}
export declare class GroupingToken extends CSSParserToken {
    value: string;
    mirror: string;
}
export declare class OpenCurlyToken extends GroupingToken {
    tokenType: string;
    constructor();
}
export declare class CloseCurlyToken extends GroupingToken {
    tokenType: string;
    constructor();
}
export declare class OpenSquareToken extends GroupingToken {
    tokenType: string;
    constructor();
}
export declare class CloseSquareToken extends GroupingToken {
    tokenType: string;
    constructor();
}
export declare class OpenParenToken extends GroupingToken {
    tokenType: string;
    constructor();
}
export declare class CloseParenToken extends GroupingToken {
    tokenType: string;
    constructor();
}
export declare class IncludeMatchToken extends CSSParserToken {
    tokenType: string;
}
export declare class DashMatchToken extends CSSParserToken {
    tokenType: string;
}
export declare class PrefixMatchToken extends CSSParserToken {
    tokenType: string;
}
export declare class SuffixMatchToken extends CSSParserToken {
    tokenType: string;
}
export declare class SubstringMatchToken extends CSSParserToken {
    tokenType: string;
}
export declare class ColumnToken extends CSSParserToken {
    tokenType: string;
}
export declare class EOFToken extends CSSParserToken {
    tokenType: string;
    toSource(): string;
}
export declare class DelimToken extends CSSParserToken {
    tokenType: string;
    value: string;
    constructor(code: number);
    toString(): string;
    toJSON(): any;
    toSource(): string;
}
export declare abstract class StringValuedToken extends CSSParserToken {
    value: string;
    ASCIIMatch(str: string): boolean;
    toJSON(): any;
}
export declare class IdentToken extends StringValuedToken {
    constructor(val: string);
    tokenType: string;
    toString(): string;
    toSource(): string;
}
export declare class FunctionToken extends StringValuedToken {
    tokenType: string;
    mirror: string;
    constructor(val: string);
    toString(): string;
    toSource(): string;
}
export declare class AtKeywordToken extends StringValuedToken {
    tokenType: string;
    constructor(val: string);
    toString(): string;
    toSource(): string;
}
export declare class HashToken extends StringValuedToken {
    tokenType: string;
    type: string;
    constructor(val: string);
    toString(): string;
    toJSON(): any;
    toSource(): string;
}
export declare class StringToken extends StringValuedToken {
    tokenType: string;
    constructor(val: string);
    toString(): string;
}
export declare class URLToken extends StringValuedToken {
    tokenType: string;
    constructor(val: string);
    toString(): string;
    toSource(): string;
}
export declare class NumberToken extends CSSParserToken {
    tokenType: string;
    type: string;
    repr: string;
    constructor();
    toString(): string;
    toJSON(): any;
    toSource(): string;
}
export declare class PercentageToken extends CSSParserToken {
    tokenType: string;
    repr: string;
    constructor();
    toString(): string;
    toJSON(): any;
    toSource(): string;
}
export declare class DimensionToken extends CSSParserToken {
    tokenType: string;
    type: string;
    repr: string;
    unit: string;
    constructor();
    toString(): string;
    toJSON(): any;
    toSource(): string;
}
