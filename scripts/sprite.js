const spriteAnimationType  = {
    idle: 0,
    walk: 1,
    fight: 2
}

const walkDirection  = {
    left: 0,
    up: 1,
    right: 2,
    down: 3
}

class spriteSheet {
    // Location to the sheet file
    #animationSettings = new Object();
    sheet = new Image();

    constructor (source) {
        this.sheet.src = source;
    }

    animationSettings(settings) {
        // Get.
        if (valueIsUndefined(settings)) {
            return this.#animationSettings;
        }
        // Set.
        else if (!valueIsUndefined(settings)) {
            this.#animationSettings.offsetX    = settings.offsetX      ? settings.offsetX    : 0;
            this.#animationSettings.offsetY    = settings.offsetY      ? settings.offsetY    : 0;
            this.#animationSettings.height     = settings.height       ? settings.height     : 0;
            this.#animationSettings.width      = settings.width        ? settings.width      : 0;
            this.#animationSettings.rate       = settings.rate         ? settings.rate       : 0;
            this.#animationSettings.frameCount = settings.frameCount   ? settings.frameCount : 0;
            this.#animationSettings.scale      = settings.scale        ? settings.scale      : 1;
            this.#animationSettings.speed      = settings.speed        ? settings.speed      : 1;

            this.#animationSettings.lastFrameDrawn = 0;
        }
    }

    animate(context, x, y, totalFrames) {
        if (this.#animationSettings) {
            const settings = this.#animationSettings;
            // TODO: There's probably a fancy mathmatical way to solve this.
            // It would be fun to try and figure that out. But for now, this
            // is easer to follow.
            
            // Speed is how frequently we want to move on to the next frame in animation.
            // If we reached that point...
            let currentFrame = (totalFrames % settings.speed) == 0 
                // then, we incriment the current frame and move to the next frame
                // or reset to 0 if we reached the last frame.
                ? ++this.#animationSettings.lastFrameDrawn % settings.frameCount
                // Otherwise, we stick to whatever frame we last drew
                : this.#animationSettings.lastFrameDrawn;
                
            this.#animationSettings.lastFrameDrawn = currentFrame;
            this.#drawFrame(context, currentFrame, 0, x, y, this.#animationSettings);
        }
    }
    
    #drawFrame(context, frameX, frameY, canvasX, canvasY, settings) {
        let width = settings.width * settings.scale;
        let height = settings.height * settings.scale;

        // Parameters:
        //  0: the image source.
        context.drawImage(this.sheet,
            //  1: X position in the sheet.
            settings.offsetX + (frameX * settings.width),
            //  2: Y position in the sheet.
            settings.offsetY + (frameY * settings.height),
            //  3: Crop the width in the sheet.
            settings.width,
            //  4: Crop the height in the sheet.
            settings.height,
            //  5: x position of where to start drawing.
            canvasX,
            //  6: Y postion of where to start drawing.
            canvasY,
            //  7: The draw width.
            width,
            //  8: the draw height.
            height);
    }
}

class sprite {
    #lastAnimation = -1;
    #sheets = new Object(null);
    #animationFrameCount = 0;
    addSheet(type, source, settings) {
        if (!valueIsUndefined(type) && source && valueIsUndefined(this.#sheets[type])) {
            this.#sheets[type] = new spriteSheet(source);
            if (!valueIsUndefined(settings)) {
                this.#sheets[type].animationSettings(settings);
            }
        }
    }

    sheetSettings(type, settings) {
        
        if (type) {
            // Get.
            if (!valueIsUndefined(this.#sheets[type]) && valueIsUndefined(settings)) {
                return this.#sheets[type].animationSettings();
            }
            // Set.      
            else if (!valueIsUndefined(this.#sheets[type]) && !valueIsUndefined(settings)) {
                this.#sheets[type].animationSettings(settings);
            }

        }
    }
    
    idle(context, x, y) {
        this.#doAnimation(spriteAnimationType.idle, context, x, y);
    }
    
    walk(direction, context, x, y) {
        this.#doAnimation(spriteAnimationType.walk, context, x, y);
    }
    
    fight(context, x, y) {
        this.#doAnimation(spriteAnimationType.fight, context, x, y);
    }

    #doAnimation(animationType, context, x, y) {
        this.#animationFrameCount = this.#lastAnimation == animationType || this.#animationFrameCount >= Number.MAX_VALUE
            ? this.#animationFrameCount + 1
            : 0;

        if (!valueIsUndefined(this.#sheets[animationType])) {
            this.#sheets[animationType].animate(context, x, y, this.#animationFrameCount);
        }
        this.#lastAnimation = animationType;
    }

    static cat() {
        let cat = new sprite();
        cat.addSheet(spriteAnimationType.idle, "assets/sprites/cat/cat_0/cat_0_idle_1.png", {
            offsetX: 0,
            offsetY: 0,
            height: 16.5,
            width: 17,
            rate: 1,
            frameCount: 2,
            scale: 4,
            speed: 50
        });
        return cat;
    }
}