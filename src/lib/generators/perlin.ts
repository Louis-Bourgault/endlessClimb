//NEW VERSION WRITTEN WHOLLY WITHOUT AI

import { seededRandom } from "./utils";
import { type GeneratorInstance, type Setting, type numberSetting } from '../types';

type vector2 = { x: number, y: number }
type dotProductChunk = Array<Array<vector2>>

const CHUNK_SIZE = 16
const SCALING_FACTOR = 10 //larger = bigger features


export class myPerlin implements GeneratorInstance {

    private chunks = new Map<string, dotProductChunk>()
    private seed: number
    private cache = new Map<vector2, number>()


    constructor(settings: Array<Setting>) {
        this.seed = Number(settings.find(s => s.name === 'Seed' && s.settingType === 'number')?.setting.value || 0);
    }
    public getHeight(x: number, y: number): number {
        
        if (y < 2 || x < 0) {
            if (x <= 0) {
                ////console.log('called with', coordinates)
            }
            return 1
        }
        let perlin = this.perlin({x:x/SCALING_FACTOR,y:y/SCALING_FACTOR})
        return perlin
    }
    public clearDistantChunks(centerX: number, centerY: number, maxDistance?: number): void {
        return
    }

    private pythagoras(pos1: vector2, pos2: vector2): number {
        const dx = Math.abs(pos1.x - pos2.x)
        const dy = Math.abs(pos1.y - pos2.y)
        return Math.sqrt(dx ^ 2 + dy ^ 2)
    }

    private perlin(coords: vector2) { //this should be a decimal number normally
        //determine grid cell corner coordinates
        const x0 = Math.floor(coords.x) //gets the bottom left 
        const y0 = Math.floor(coords.y)
        const x1 = x0 + 1
        const y1 = y0 + 1



        /* const d00 = this.pythagoras(coords, {x:x0,y:y0}) * this.getSingleVector({x:x0,y:y0})
        const d01 = this.pythagoras(coords, {x:x0,y:y1})
        const d11 = this.pythagoras(coords, {x:x1,y:y1})
        const d10 = this.pythagoras(coords, {x:x1,y:y0}) */

        const dp00 = this.dotProduct(this.normaliseVector({ x: x0, y: y0 }), this.getSingleVector({ x: x0, y: y0 }))
        const dp01 = this.dotProduct(this.normaliseVector({ x: x0, y: y1 }), this.getSingleVector({ x: x0, y: y1 }))
        const dp11 = this.dotProduct(this.normaliseVector({ x: x1, y: y1 }), this.getSingleVector({ x: x1, y: y1 }))
        const dp10 = this.dotProduct(this.normaliseVector({ x: x1, y: y0 }), this.getSingleVector({ x: x1, y: y0 }))

        //now we have to interpolate these things
        const sx = coords.x - x0;
        const sy = coords.y - y0;
        const i1 = this.lerp(dp00, dp10, sx);
        const i2 = this.lerp(dp01, dp11, sx);
        const finalValue = this.lerp(i1, i2, sy);

        return finalValue;
    }


    private lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }



    private normaliseVector(coords: vector2) {
        const magnitude = Math.sqrt(coords.x * coords.x + coords.y * coords.y);
        if (magnitude === 0) {
            return { x: 0, y: 0 };
        }
        return { x: coords.x / magnitude, y: coords.y / magnitude };
    }

    private getSingleVector(coords: vector2) {
        const xChunk = Math.floor(coords.x / CHUNK_SIZE)
        const yChunk = Math.floor(coords.y / CHUNK_SIZE)

        let chunk = this.chunks.get(xChunk + ',' + yChunk)
        if (!chunk) {
            chunk = this.generateUnitVectors({ x: xChunk, y: yChunk })
        }
        let value = chunk[coords.x % CHUNK_SIZE][coords.y % CHUNK_SIZE]
        return value
    }

    private dotProduct(a: vector2, b: vector2) {
        return a.x * b.x + a.y * b.y
    }


    private generateUnitVectors(coords: vector2) {
        let vectors: dotProductChunk = []
        for (let i = 0; i < CHUNK_SIZE; i++) {
            let currentVectorRow: Array<vector2> = []
            for (let j = 0; j < CHUNK_SIZE; j++) {
                const angle = seededRandom(CHUNK_SIZE * coords.x + i, CHUNK_SIZE*coords.y+j, this.seed) * Math.PI * 2 //the angle in radians
                currentVectorRow.push({ x: Math.sin(angle), y: Math.cos(angle) })
            }
            vectors.push(currentVectorRow)
        }
        this.chunks.set(coords.x + ',' + coords.y, vectors)
        return vectors
    }



}

//generate unit vectors
//choose distance to each of the vectors (normalise)
//take dot product of vectors and the distance vector
//interpolate based on closeness with linear interpolation



//https://www.youtube.com/watch?v=kCIaHqb60Cw