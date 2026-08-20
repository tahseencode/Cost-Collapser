export interface PackageJsonLike {
    bin?: string | Record<string, string>;
    main?: string;
}
export declare function findPackageRoot(startFile: string, fileExists?: (candidate: string) => boolean): string;
export declare function getBuiltEntryCandidates(packageRoot: string, readFile?: (filePath: string) => string): string[];
export declare function getCliManifestPath(clisDir: string): string;
