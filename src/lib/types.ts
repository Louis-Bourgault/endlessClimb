export type Setting = {
    name: string
    settingType: 'options' | 'number' | 'string'
    setting: optionsSetting | numberSetting | stringSetting

}

export type optionsSetting = {
    options: string[]
    default: string
    value: string
}

export type stringSetting = {
    default: string
    value: string
    maxLen: number
    minLen: number
    colour: boolean
}

export type numberSetting = {
    default: number,
    value: number,
    integerOnly: boolean
    minimum: number | null
    maximum: number | null
}

export type GeneratorEntry = {
    name: string;
    class: GeneratorConstructor;
    desc: string;
    settings: Setting[];
    scalingAndThreshold: {
        scaling: number;
        threshold: number;
        customisable: boolean;
    }

}

export type BackgroundEntry = {
    name: string;
    type: 'Static' | 'Animated' | 'Shader'
    class: BackgroundConstructor;
    desc: string;
    settings: Setting[];

}



export interface GeneratorInstance {
    getHeight(x: number, y: number): number;
    clearDistantChunks(centerX: number, centerY: number, maxDistance?: number): void;
}

export interface GeneratorConstructor {
    new(settings: Setting[]): GeneratorInstance;
}

export interface BackgroundInstance {
    renderBackground(image: ImageData): void;
    //there are possibilities that in future there will be a way to send signals from the game eg x,y level to change the background (for parralax for example). This will be encapsulated here
}

export interface BackgroundConstructor {
    new(settings: Setting[]): BackgroundInstance
}

