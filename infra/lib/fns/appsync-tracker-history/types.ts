import { Span } from "./constants";

type Span = (typeof Span)[keyof typeof Span];

export type { Span };
