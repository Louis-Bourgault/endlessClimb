import { myPerlin } from "./perlin";
import type { GeneratorEntry } from "../types";

export const generators: GeneratorEntry[] = [
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
        scalingAndThreshold: { //contains the values for the default scaling and threshold which is passed to the game engine. If you want to make a generator which handles this inside its own code, you can do that too, and define a setting so the user can change this internal setting
            scaling: 5,
            threshold: 0.53,
            customisable: true
        }
    }
];


