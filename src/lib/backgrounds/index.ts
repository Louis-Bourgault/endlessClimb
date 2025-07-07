import type { BackgroundEntry } from "$lib/types";
import { ColourBackground } from "./colourBackground";

export const backgrounds: BackgroundEntry[] = [
    {
        name: 'Colour',
        class: ColourBackground,
        desc: 'A blank background of customisable colour',
        settings: [
            {
                name: 'Colour Code',
                settingType: 'string',
                setting: {
                    default: '#FFFFFF',
                    value: '#FFFFFF',
                    maxLen: 7,
                    minLen: 6,
                    colour: true
                }
            }
        ],
        type: "Static"
    }
]