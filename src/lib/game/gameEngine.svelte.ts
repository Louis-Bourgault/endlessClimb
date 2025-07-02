import type { GeneratorInstance } from "$lib/generators/types";
import { PerlinNoise } from "$lib/generators/perlin";


type vector2 = { x: number, y: number }

//todo: add headhitter jumps so that we can jump under a ledge and the game lets us do this

export class InfiniteClimbGame {
    public htmlCanvas: HTMLCanvasElement;
    public ctx!: CanvasRenderingContext2D
    private blockTexture!: ImageData;
    public viewportPixelResolution: vector2;
    public targetFPS: number = 60

    public currentFPS: number | null = $state(null)

    public blockSize = 10;
    public realViewportSize: vector2

    public playerCoordinates: vector2 = $state({ x: 0, y: 2 })
    public characterSize: vector2 = { x: 1, y: 1 } //this is the size in the game units, not the screen units
    public movementVector: vector2 = { x: 0, y: 0 }
    public movementSpeed: number = 8
    public gravity = 7 //NOT realistic, this is on purpose
    public jumpForce = 3
    public lastJumpTime = Date.now()
    public jumpCooldown: number = 300 //this is in milliseconds and allows mainGameLoop to run in between jumps
    public velocity: vector2 = $state({ x: 0, y: 0 })
    public isGrounded: boolean = $state(true)

    public viewportBottomLeft: vector2 = { x: 0, y: 0 }

    public generator: GeneratorInstance
    public scalingFactor = 2;
    public threshold = 0.53;

    public gameActive = true
    public lastFrame: number


    constructor(canvas: HTMLCanvasElement, document: Document, generator: GeneratorInstance, scalingFactor: number, threshold: number) {
        this.htmlCanvas = canvas;
        if (!canvas) {
            throw new Error('no canvas passed to function')
        }
        this.scalingFactor = scalingFactor;
        this.threshold = threshold;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Could not get 2D context from canvas');
        }
        this.ctx = context;

        this.viewportPixelResolution = { x: canvas.width, y: canvas.height }
        this.realViewportSize = { x: canvas.width / this.blockSize, y: canvas.width / this.blockSize }
        this.generator = generator;

        document.addEventListener('keydown', (e) => {
            if (e.key == 'a' || e.key == 'arrowleft') {
                this.movementVector.x = -1;
                ////console.log('left keydown')
            }
            if (e.key == 'd' || e.key == 'arrowright') {
                this.movementVector.x = 1;
            }

            if (e.key == 'space' || e.key == 'w' || e.key == 'arrowup') {
                this.handleJump();
            }
            if (e.key == 'q') {
                this.blockSize--
                this.resize()
            }
            if (e.key == 'e') {
                this.blockSize++
                this.resize()
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
            this.viewportPixelResolution.x = window.innerWidth;
            this.viewportPixelResolution.y = window.innerHeight;
            this.resize()
            //console.log('resized window, should we maybe do something about this??')

        });
        this.lastFrame = Date.now()


    }

    public stopGame() {
        this.gameActive = false;
    }

    public resize() {
        this.realViewportSize = { x: this.viewportPixelResolution.x / this.blockSize, y: this.viewportPixelResolution.y / this.blockSize }
    }

    private handleJump() {
        //this.checkGrounded()
        const time = Date.now()
        if (this.isGrounded && time - this.lastJumpTime > this.jumpCooldown) {

            //console.log('jumped')
            this.velocity.y += this.jumpForce
            this.lastJumpTime = time
            this.isGrounded = false
        }
    }

    public checkGrounded() {
        const blockToCheck = { x: this.playerCoordinates.x, y: Math.floor(this.playerCoordinates.y - 1) }
        const otherBlockToCheck = { x: this.playerCoordinates.x + 1, y: Math.floor(this.playerCoordinates.y - 1) }

        if (this.getBlock(blockToCheck) || this.getBlock(otherBlockToCheck)) {
            this.isGrounded = true
            //console.log('checked and we are grounded ')
            //this.playerCoordinates.y = Math.floor(this.playerCoordinates.y - 1) + 1
        }
        else {
            this.isGrounded = false
        }
    }

    private checkCollision(newPosition: vector2) {
        const corners = [
            { x: Math.floor(newPosition.x), y: Math.floor(newPosition.y) }, // bottom-left
            { x: Math.floor(newPosition.x + this.characterSize.x - 0.01), y: Math.floor(newPosition.y) }, // bottom-right
            { x: Math.floor(newPosition.x), y: Math.floor(newPosition.y + this.characterSize.y - 0.01) }, // top-left
            { x: Math.floor(newPosition.x + this.characterSize.x - 0.01), y: Math.floor(newPosition.y + this.characterSize.y - 0.01) } // top-right
        ]
        return corners.some(corner => this.getBlock(corner))
    }

    public render() {
        let imageData = this.ctx.createImageData(this.viewportPixelResolution.x, this.viewportPixelResolution.y)
        
        //pixel align it so that its not so jumpy
        const pixelAlignedViewportBottomLeft = {
            x: Math.floor(this.viewportBottomLeft.x * this.blockSize) / this.blockSize,
            y: Math.floor(this.viewportBottomLeft.y * this.blockSize) / this.blockSize
        }
        
        //account for partial blocks
        const startX = Math.floor(pixelAlignedViewportBottomLeft.x)
        const endX = Math.ceil(pixelAlignedViewportBottomLeft.x + this.realViewportSize.x) + 1
        const startY = Math.floor(pixelAlignedViewportBottomLeft.y)
        const endY = Math.ceil(pixelAlignedViewportBottomLeft.y + this.realViewportSize.y) + 1
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                //calculate screen position
                let offsetCoordinates: vector2 = { 
                    x: x - this.viewportBottomLeft.x, 
                    y: y - this.viewportBottomLeft.y 
                }
                
                let screenCoords: vector2 = { 
                    x: Math.round(offsetCoordinates.x * this.blockSize), 
                    y: Math.round(this.viewportPixelResolution.y - (offsetCoordinates.y * this.blockSize)) 
                }
                
                if (this.getBlock({ x,y })) {
                    this.renderBlock(screenCoords, imageData)
                }
            }
        }
        
        // Player rendering with consistent positioning
        let playerOffsetWorldRenderCoords: vector2 = { 
            x: this.playerCoordinates.x - this.viewportBottomLeft.x, 
            y: this.playerCoordinates.y - this.viewportBottomLeft.y 
        }
        let playerScreenCoordinates: vector2 = { 
            x: Math.round(playerOffsetWorldRenderCoords.x * this.blockSize), 
            y: Math.round(this.viewportPixelResolution.y - (playerOffsetWorldRenderCoords.y * this.blockSize)) 
        }
        
        this.renderPlayer(playerScreenCoordinates, imageData)
        this.ctx.putImageData(imageData, 0, 0)
    }

    public renderPlayer(screenCoords: vector2, imageData: ImageData) {
        let characterScreenSize = { x: this.characterSize.x * this.blockSize, y: this.characterSize.y * this.blockSize }
        let topLeft = { x: screenCoords.x, y: screenCoords.y - characterScreenSize.y }
        
        for (let y = 0; y < characterScreenSize.y; y++) {
            for (let x = 0; x < characterScreenSize.x; x++) {
                let pixelX = topLeft.x + x;
                let pixelY = topLeft.y + y;

                if (pixelX >= 0 && pixelX < imageData.width && pixelY >= 0 && pixelY < imageData.height) {
                    const index = (pixelY * imageData.width + pixelX) * 4;
                    imageData.data[index] = 0;     // Red
                    imageData.data[index + 1] = 0; // Green
                    imageData.data[index + 2] = 255; // Blue
                    imageData.data[index + 3] = 255; // Alpha
                }
            }
        }
    }

    public renderBlock(screenCoords: vector2, imageData: ImageData) {
        //this is just a blue pixel for now
        const blockPixelSize = this.blockSize
        let topLeft = { x: screenCoords.x, y: screenCoords.y - blockPixelSize }
        
        for (let y = 0; y < blockPixelSize; y++) {
            for (let x = 0; x < blockPixelSize; x++) {
                let pixelX = topLeft.x + x;
                let pixelY = topLeft.y + y;

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

    private getBlock(coordinates: vector2) {


        if (coordinates.y < 2 || coordinates.x < 0) {
            if (coordinates.x <= 0) {
                ////console.log('called with', coordinates)
            }
            return true
        }
        else if (this.generator.getHeight(Math.floor(coordinates.x * this.scalingFactor), Math.floor(coordinates.y * this.scalingFactor)) > this.threshold) {
            return true
        }
        else return false
    }

    public handleMovement(deltaT: number) { //deltaT is a decimal number of seconds, ideally something like 0.033 for 30fps

        const intendedPosition = { x: this.playerCoordinates.x + this.movementVector.x * this.movementSpeed * deltaT, y: this.playerCoordinates.y }
        if (!this.checkCollision(intendedPosition)) {
            this.playerCoordinates.x += this.movementVector.x * this.movementSpeed * deltaT
        }
        else {
            //console.log('collision detected')
            if (this.movementVector.x < 0) {
                this.playerCoordinates.x = Math.floor(this.playerCoordinates.x)
            }
            if (this.movementVector.x > 0) {
                this.playerCoordinates.x = Math.ceil(this.playerCoordinates.x)
            }

        }
        this.checkGrounded()
        if (this.isGrounded && this.velocity.y <= 0) {
            this.velocity.y = 0
        } else {
            //console.log('were not grounded rn, doing velocity things')
            this.velocity.y -= this.gravity * deltaT
            const intendedPosition = { x: this.playerCoordinates.x, y: this.playerCoordinates.y + this.velocity.y }
            if (!this.checkCollision(intendedPosition)) {
                this.playerCoordinates = intendedPosition
            }
            else {
                this.playerCoordinates = { x: this.playerCoordinates.x, y: Math.floor(this.playerCoordinates.y) }
                this.isGrounded = true
                this.velocity.y = 0
            }
        }
        if (this.playerCoordinates.y < 2) {
            this.playerCoordinates.y = 2
        }
        this.checkGrounded()
        if (this.isGrounded) {
            this.playerCoordinates = { x: this.playerCoordinates.x, y: Math.floor(this.playerCoordinates.y) }
        }
    }

    public safeSpawn() {
        this.playerCoordinates = { x: 0, y: 0 }
        this.velocity = { x: 0, y: 0 }
        //this.checkCollision returns true if there is a collision
        if (this.checkCollision(this.playerCoordinates)) {
            for (let i = 0; i < 15; i++) {
                for (let j = 0; j < 15; j++) {
                    if (!this.checkCollision({ x: this.playerCoordinates.x + i, y: this.playerCoordinates.y + j })) {
                        //has found a valid spawn point
                        this.playerCoordinates = { x: i, y: j }
                        this.velocity = { x: 0, y: 0 }
                        return
                    }
                }
            }
            //if no valid spawn point was found, try again with a different seed
            //this.seed = Math.random()
            //this.perlin = new PerlinNoise(this.seed)
            //this.safeSpawn()
        }
    }

    public start() {
        let targetFrameTime = 1000 / this.targetFPS
        this.safeSpawn()
        setInterval(() => { this.mainGameLoop() }, targetFrameTime)
    }

    public handleChangeViewport(deltaT: number) {
        //check how close the player is to the edge of the screen
        //aim to always keep them between 25% and 75% on the x axis, and between 10% and 55% on the y axis (measured from the bottom of the screen)
        //also deltaT is here to smooth it a bit, but will not be used yet (this is for later on)
        //NOTE ABOUT DELTA TIME: TBH its fine as it is, i'll leave the passing to the function for now but it really is unneccesary to have any further smoothing than we already have got

        if (this.playerCoordinates.x < this.viewportBottomLeft.x + this.realViewportSize.x * 0.25) {
            this.viewportBottomLeft.x -= (this.viewportBottomLeft.x + this.realViewportSize.x * 0.25 - this.playerCoordinates.x) * 0.1
        }
        if (this.playerCoordinates.x > this.viewportBottomLeft.x + this.realViewportSize.x * 0.75) {
            this.viewportBottomLeft.x += (this.playerCoordinates.x - (this.viewportBottomLeft.x + this.realViewportSize.x * 0.75)) * 0.1
        }
        if (this.playerCoordinates.y < this.viewportBottomLeft.y + this.realViewportSize.y * 0.1) {
            this.viewportBottomLeft.y -= (this.viewportBottomLeft.y + this.realViewportSize.y * 0.1 - this.playerCoordinates.y) * 0.1
        }
        if (this.playerCoordinates.y > this.viewportBottomLeft.y + this.realViewportSize.y * 0.55) {
            this.viewportBottomLeft.y += (this.playerCoordinates.y - (this.viewportBottomLeft.y + this.realViewportSize.y * 0.55)) * 0.1
        }
    }

    public mainGameLoop() {
        if (!this.gameActive) {
            return
        }
        let currentTime = Date.now()
        let deltaT = currentTime - this.lastFrame
        this.lastFrame = currentTime
        this.currentFPS = (1000 / deltaT)
        this.handleMovement(deltaT / 1000) //time in seconds since last frame
        this.handleChangeViewport(deltaT / 1000)
        this.render()
    }


}