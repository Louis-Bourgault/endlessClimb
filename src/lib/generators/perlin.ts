//TODO: change this out for a custom implementation that I understand. This current implementation is fully coded by AI (Github Copilot) and will be soon replaced with one that I do fully from scratch
//That being said, this was a useful tool for testing purposes as it let me easily prototype the game engine without having to do the difficult coding myself


import { type GeneratorInstance, type GenSetting, type numberGenSetting } from './types';
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

export function randomUnitVector(x: number, y: number, seed: number): { x: number; y: number } {
    const theta = seededRandom(x, y, seed) * 2 * Math.PI;
    return { x: Math.cos(theta), y: Math.sin(theta) };
}

// Smoothstep function for smooth interpolation
function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}







export class PerlinNoise implements GeneratorInstance{
    public seed: number;
    public chunkSize = 32; // 32x32 chunks
    public chunks = new Map<string, number[][]>(); // Map of chunk coordinates to 2D arrays of noise values
    private gradients = new Map<string, { x: number; y: number }>(); // Cache for gradient vectors

    constructor(settings: GenSetting[]) {
        const tempSeed = settings.find(s => s.name === 'Seed' && s.settingType === 'number')?.setting.value || 0;
        console.log('found seed:', tempSeed)
        if (typeof tempSeed === 'number') {
            this.seed = tempSeed;
        }
        else {
            throw new Error('Invalid seed value, seed is not of number type');
        }
    }

    // Get a gradient vector for a grid point
    private getGradient(x: number, y: number): { x: number; y: number } {
        const key = `${x},${y}`;
        if (!this.gradients.has(key)) {
            this.gradients.set(key, randomUnitVector(x, y, this.seed));
        }
        return this.gradients.get(key)!;
    }

    // Calculate dot product between gradient and distance vectors
    private dotGridGradient(ix: number, iy: number, x: number, y: number): number {
        const gradient = this.getGradient(ix, iy);
        const dx = x - ix;
        const dy = y - iy;
        return dx * gradient.x + dy * gradient.y;
    }

    // Generate Perlin noise for a given point
    private noise(x: number, y: number): number {
        // Determine grid cell coordinates
        const x0 = Math.floor(x);
        const x1 = x0 + 1;
        const y0 = Math.floor(y);
        const y1 = y0 + 1;

        // Determine interpolation weights
        const sx = smoothstep(x - x0);
        const sy = smoothstep(y - y0);

        // Calculate dot products
        const n0 = this.dotGridGradient(x0, y0, x, y);
        const n1 = this.dotGridGradient(x1, y0, x, y);
        const ix0 = lerp(n0, n1, sx);

        const n2 = this.dotGridGradient(x0, y1, x, y);
        const n3 = this.dotGridGradient(x1, y1, x, y);
        const ix1 = lerp(n2, n3, sx);

        const value = lerp(ix0, ix1, sy);
        
        // Normalize to [0, 1] range
        return (value + 1) * 0.5;
    }

    // Generate noise with multiple octaves for more natural terrain
    public octaveNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5, scale: number = 0.1): number {
        let value = 0;
        let amplitude = 1;
        let frequency = scale;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            value += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }

        return value / maxValue;
    }

    // Generate a chunk of terrain heights
    public generateChunk(chunkX: number, chunkY: number): number[][] {
        const key = `${chunkX},${chunkY}`;
        
        if (this.chunks.has(key)) {
            return this.chunks.get(key)!;
        }

        const chunk: number[][] = [];
        
        for (let y = 0; y < this.chunkSize; y++) {
            const row: number[] = [];
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;
                
                // Generate height using octave noise for more natural terrain
                const height = this.octaveNoise(worldX, worldY, 4, 0.5, 0.02);
                row.push(height);
            }
            chunk.push(row);
        }

        this.chunks.set(key, chunk);
        return chunk;
    }

    // Get terrain height at a specific world coordinate
    public getHeight(x: number, y: number): number {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const localX = x - chunkX * this.chunkSize;
        const localY = y - chunkY * this.chunkSize;

        const chunk = this.generateChunk(Math.floor(chunkX), Math.floor(chunkY));
        
        if (localX >= 0 && localX < this.chunkSize && localY >= 0 && localY < this.chunkSize) {
            return chunk[localY][localX];
        }
        
        // If out of bounds, generate noise directly
        return this.octaveNoise(x, y, 4, 0.5, 0.02);
    }

    // Clear chunks to free memory (useful for infinite worlds)
    public clearDistantChunks(centerX: number, centerY: number, maxDistance: number = 5): void {
        const chunksToRemove: string[] = [];
        
        for (const [key] of this.chunks) {
            const [chunkX, chunkY] = key.split(',').map(Number);
            const distance = Math.sqrt((chunkX - centerX) ** 2 + (chunkY - centerY) ** 2);
            
            if (distance > maxDistance) {
                chunksToRemove.push(key);
            }
        }
        
        chunksToRemove.forEach(key => this.chunks.delete(key));
    }

    // Reset the noise generator with a new seed
    private setSeed(newSeed: number): void {
        this.seed = newSeed;
        this.gradients.clear();
        this.chunks.clear();
    }
}

// Example usage:
// const noise = new PerlinNoise(12345); // Use a specific seed
// const height = noise.getHeight(100, 50); // Get height at world coordinates (100, 50)
// const chunk = noise.generateChunk(0, 0); // Generate chunk at (0, 0)