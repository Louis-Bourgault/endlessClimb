import type { BackgroundInstance, Setting } from "$lib/types";

export class ColourBackground implements BackgroundInstance {
    private hexColour: string
    private rgb = { r: 0, g: 0, b: 0 }
    private lastLength: undefined | number
    private lastData: undefined | ImageData
    constructor(settings: Setting[]) {
        console.log(settings)
        this.hexColour = String(settings.find(set => set.name === 'Colour Code' && set.settingType === 'string')?.setting.value) || '#FFFFFF'
        console.log(this.hexColour)
        let cleanHex = this.hexColour.startsWith('#') ? this.hexColour.slice(1) : this.hexColour;
        this.rgb.r = parseInt(cleanHex.substring(0, 2), 16);
        this.rgb.g = parseInt(cleanHex.substring(2, 4), 16);
        this.rgb.b = parseInt(cleanHex.substring(4, 6), 16);
        console.log('new colour background wit colour:', this.hexColour, this.rgb)
    }

    public renderBackground(image: ImageData): void {
        //console.log(this.lastData, image.data.length, this.lastLength)
        if (image.data.length === this.lastLength) {
            if (!this.lastData) {
                this.lastLength = undefined
                return
            }
            image.data.set(this.lastData?.data)
        } else {
            console.log('something has changed, lets render bg from scratch')
            for (let i = 0; i < image.data.length; i += 4) {
                image.data[i] = this.rgb.r;     // Red
                image.data[i + 1] = this.rgb.g; // Green
                image.data[i + 2] = this.rgb.b; // Blue
                image.data[i + 3] = 255;        // Alpha
            }
            //cache so there's less lag
            this.lastData = new ImageData(
                new Uint8ClampedArray(image.data), //make a copy so that it doesnt save the image of the platforms on top of this
                image.width,
                image.height
            )
            this.lastLength = image.data.length;
        }
    }
}