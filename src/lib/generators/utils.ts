export function seededRandom(x: number, y: number, seed: number): number {
    let hash = seed;
    hash = ((hash << 5) - hash + x) & 0xffffffff;
    hash = ((hash << 5) - hash + y) & 0xffffffff;
    hash = hash ^ (hash >>> 16);
    hash = (hash * 0x85ebca6b) & 0xffffffff;
    hash = hash ^ (hash >>> 13);
    hash = (hash * 0xc2b2ae35) & 0xffffffff;
    hash = hash ^ (hash >>> 16);
    return Math.abs(hash) / 0x7fffffff; // Convert to 0-1 range
}