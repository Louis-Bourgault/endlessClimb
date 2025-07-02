//OLD SYSTEM, NOT CURRENTLY USED. A better game engine is implemented in ./gameEngine.svelte.ts

import { PerlinNoise } from "$lib/generators/perlin";

type vector2 = { x: number, y: number }
export class InfiniteClimbGame {
    public htmlCanvas: HTMLCanvasElement;
    public ctx!: CanvasRenderingContext2D
    private blockTexture!: ImageData;
    private worldCoordinateScaling = 5




    private playerCoordinates: vector2 = { x: 10, y: 10 };
    private grounded = false;
    private jumpVelocity = 5;
    private movementVector: vector2 = { x: 0, y: 0 };
    private gravity: number = -0.5
    public scalingFactor = 5 //how many pixels each unit on the coordinates represents. Can be changed for example for high ppi monitors
    public renderWindowSize!: vector2
    public actualCoordinateSize!: vector2
    public viewportBottomLeft: vector2

    public lastFrame: any

    public seed: number
    public perlin: PerlinNoise
    constructor(canvas: HTMLCanvasElement, document: Document) {
        this.htmlCanvas = canvas;
        if (!canvas) {
            throw new Error('no canvas passed to function')
        }
        this.ctx = canvas.getContext('2d')!

        this.updateWindowSize(canvas.width, canvas.height)
        this.seed = Math.floor(Math.random() * 1000);
        this.perlin = new PerlinNoise(this.seed);
        this.viewportBottomLeft = { x: this.playerCoordinates.x - this.actualCoordinateSize.x / 2, y: this.playerCoordinates.y - this.actualCoordinateSize.y / 2 };


        document.addEventListener('keydown', (e) => {
            if (e.key == 'a' || e.key == 'arrowleft') {
                this.movementVector.x = -1;
            }
            if (e.key == 'd' || e.key == 'arrowright') {
                this.movementVector.x = 1;
            }

            if (e.key == 'space' || e.key == 'w' || e.key == 'arrowup') {
                this.handleJump();
            }

        });

        document.addEventListener('keyup', (e) => {
            if (e.key == 'a' || e.key == 'arrowleft') {
                if (this.movementVector.x == -1) {
                    this.movementVector.x = 0;
                }
            }
            if (e.key == 'd' || e.key == 'arrowright') {
                if (this.movementVector.x == 1) {
                    this.movementVector.x = 0;
                }
            }
        });

        window.addEventListener('resize', () => {
            this.htmlCanvas.width = window.innerWidth;
            this.htmlCanvas.height = window.innerHeight;
            this.updateWindowSize(this.htmlCanvas.width, this.htmlCanvas.height);
        });

        //////console.log('game initialised')

    }

    public start() {
        this.lastFrame = Date.now();
        const targetFPS = 30;
        const targetFrameTime = 1000 / targetFPS; // milliseconds per frame

        setInterval(() => { this.mainLoop() }, targetFrameTime)
        //////console.log('game start called')

    }



    public async loadBlockTexture() {
        const imagePath = '/textures/texture1.png'
        const img = new Image();
        img.src = imagePath;
        await new Promise((resolve) => {
            img.onload = resolve;
        });

        // Create a temporary canvas to extract ImageData
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(img, 0, 0);

        this.blockTexture = tempCtx.getImageData(0, 0, img.width, img.height);
    }

    private updateWindowSize(x: number, y: number) {
        this.renderWindowSize = { x: x, y: y }
        this.actualCoordinateSize = { x: this.renderWindowSize.x / this.scalingFactor, y: this.renderWindowSize.y / this.scalingFactor }
    }

    public handleMovement(deltaT: number) {
        this.checkGrounded()

        //apply gravity
        if (!this.grounded) {
            this.movementVector.y += this.gravity * deltaT
            //////console.log(this.movementVector, 'thats the movement vector btw')
        }
        else if (this.movementVector.y < 0) { //if they're not jumping and are grounded, set to 0
            this.movementVector.y = 0;
        }

        this.playerCoordinates.x += this.movementVector.x * deltaT
        this.playerCoordinates.y += this.movementVector.y * deltaT

    }

    public applyChangeViewport() {
        this.viewportBottomLeft = {x: this.playerCoordinates.x - (0.5 * this.actualCoordinateSize.x), y: this.playerCoordinates.y - (0.5 * this.actualCoordinateSize.y)}

    }

    public checkGrounded() {
        const scaledX = this.playerCoordinates.x * this.worldCoordinateScaling;
        const scaledY = this.playerCoordinates.y * this.worldCoordinateScaling;
        
        //////console.log('checkGrounded called with player coords:', this.playerCoordinates);
        //////console.log('scaled coords being passed to getHeight:', { x: scaledX, y: scaledY });
        
        if (scaledX < 0 || scaledY < 0) {
            //////console.log('negative scaled values, setting grounded to true');
            this.grounded = true;
            return;
        }

        let belowNoiseValue = this.perlin.getHeight(Math.floor(scaledX), Math.floor(scaledY));
        if (belowNoiseValue > 0.55) {
            this.grounded = true;
        }
        else {
            this.grounded = false;
        }
    }


    public mainLoop() { //deltaT is the time in seconds since the last frame rendered
        let deltaT = 0
        if (this.lastFrame) {
            let ms = Date.now() - this.lastFrame;
            //////console.log(ms, 'milliseconds have passed')
            deltaT = ms / 1000
        }
        this.lastFrame = Date.now();

        this.handleMovement(deltaT)
        this.applyChangeViewport()

        this.render()
        ////console.log('mainloop just ran with a deltaT of', deltaT)


    }

    public handleJump() {
        if (this.grounded == true) {
            this.movementVector.y += this.jumpVelocity;
        }

    }

    private drawBlockAt(imageData: ImageData, x: number, y: number) {
        for (let dx = 0; dx < this.scalingFactor; dx++) {
            for (let dy = 0; dy < this.scalingFactor; dy++) {
                const pixelX = x + dx;
                const pixelY = y + dy;

                // Check bounds to avoid drawing outside the canvas
                if (pixelX >= 0 && pixelX < imageData.width && pixelY >= 0 && pixelY < imageData.height) {
                    const index = (pixelY * imageData.width + pixelX) * 4;
                    imageData.data[index] = 0;     // Red
                    imageData.data[index + 1] = 0; // Green
                    imageData.data[index + 2] = 0; // Blue
                    imageData.data[index + 3] = 255; // Alpha
                }
            }
        }
    }


    private drawPlayerBlockAt(imageData: ImageData, x: number, y: number) {
        ////console.log('rendering player at REAL SCREEN LOCATION of ',{x,y})
        for (let dx = 0; dx < this.scalingFactor; dx++) {
            for (let dy = 0; dy < this.scalingFactor; dy++) {
            const pixelX = x + dx;
            const pixelY = y + dy;

            // Check bounds to avoid drawing outside the canvas
            if (pixelX >= 0 && pixelX < imageData.width && pixelY >= 0 && pixelY < imageData.height) {
                const index = (pixelY * imageData.width + pixelX) * 4;
                imageData.data[index] = 255;     // Red
                imageData.data[index + 1] = 0;   // Green
                imageData.data[index + 2] = 0;   // Blue
                imageData.data[index + 3] = 255; // Alpha
            }
            }
        }
    }

    public render() {
        let imageData = this.ctx?.createImageData(this.renderWindowSize.x, this.renderWindowSize.y)
        for (let i = 0; i <= this.actualCoordinateSize.x; i++) {
            for (let j = 0; j <= this.actualCoordinateSize.y; j++) {
                let noiseValue = this.perlin.getHeight(i * this.worldCoordinateScaling, j * this.worldCoordinateScaling);
                //////console.log('getHeight returned', {noiseValue, i, j})
                if (noiseValue > 0.55) { //hardcoded for now, TODO: update to settable values

                    this.drawBlockAt(imageData, i * this.scalingFactor, j * this.scalingFactor);
                    //////console.log('found a value where x and why are,', {i, j})
                }



            }
        }
        this.drawPlayerBlockAt(imageData, this.playerCoordinates.x * this.scalingFactor , this.playerCoordinates.y * this.scalingFactor )
        ////console.log('player went at', this.playerCoordinates)

        this.ctx.putImageData(imageData, 0, 0)

    }


}