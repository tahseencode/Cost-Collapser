/**
 * Shared manifest types — kept in their own module so both runtime code
 * (discovery.ts) and the build-time compiler (build-manifest.ts) can
 * import them without pulling each other in. This is what lets us
 * exclude `src/build-manifest.ts` from `tsc`'s emit set: the only thing
 * runtime code needs from build-manifest is the `ManifestEntry` type,
 * and that lives here.
 */
export {};
