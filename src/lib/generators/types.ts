export interface GeneratorInstance {
    getHeight(x: number, y: number): number;
    clearDistantChunks(centerX: number, centerY: number, maxDistance?: number): void;
}

export type GenSetting = {
    name: string
    settingType: 'options' | 'number'
    setting: optionsGenSetting | numberGenSetting

}

type optionsGenSetting = {
    options: string[]
    default: string
    value: string
}

export type numberGenSetting = {
    default: number,
    value: number,
    integerOnly: boolean
    minimum: number | null
    maximum: number | null
}