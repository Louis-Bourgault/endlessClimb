import { myPerlin } from "./perlin";
import type { GeneratorInstance, GenSetting } from "./types";



export interface GeneratorConstructor {
    new(settings: GenSetting[]): GeneratorInstance;
}

export const generators: GeneratorEntry[] = [
    /* {
        name: "Perlin Noise (AI)",
        class: PerlinNoise,
        desc: "Generates Perlin noise for terrain generation.",
        settings: [
            {
                name: 'Seed',
                settingType: 'number',
                setting: {
                    default: 985433,
                    integerOnly: true,
                    minimum: 0,
                    maximum: 99999999999,
                    value: Math.floor(Math.random() * 99999999999),
                }
            }
        ],
        scalingAndThreshold: {
            scaling: 5,
            threshold: 0.53,
            customisable: true
        }
    }, */
    {
        name: "Perlin Noise",
        class: myPerlin,
        desc: "Generates Perlin noise for terrain generation.",
        settings: [
            {
                name: 'Seed',
                settingType: 'number',
                setting: {
                    default: 985433,
                    integerOnly: true,
                    minimum: 0,
                    maximum: 99999999999,
                    value: Math.floor(Math.random() * 99999999999),
                }
            }
        ],
        scalingAndThreshold: {
            scaling: 5,
            threshold: 0.53,
            customisable: true
        }
    }
];


type GeneratorEntry = {
    name: string;
    class: GeneratorConstructor;
    desc: string;
    settings: GenSetting[];
    scalingAndThreshold: {
        scaling: number;
        threshold: number;
        customisable: boolean;
    }

}

