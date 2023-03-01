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
        }
    }

    animate(context, x, y, totalFrames) {
        if (this.#animationSettings) {
            // For now, draw frame 0 but eventually use totalFrames 
            // to perform the animation.
            this.#drawFrame(context, 0, 0, x, y, this.#animationSettings);
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
    #sheets = new Object(null);

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
    
    idle(context, x, y, totalFrames) {
         this.#doAnimation(spriteAnimationType.idle, context, x, y, totalFrames);
    }
    
    walk(direction, context, x, y, totalFrames) {
        this.#doAnimation(spriteAnimationType.walk, context, x, y, totalFrames);
    }
    
    fight(context, x, y, totalFrames) {
        this.#doAnimation(spriteAnimationType.fight, context, x, y, totalFrames);
    }

    #doAnimation(animationType, context, x, y, totalFrames) {
        if (!valueIsUndefined(this.#sheets[animationType])) {
            this.#sheets[animationType].animate(context, x, y, totalFrames);
        }
    }

    static cat() {
        let cat = new sprite();
        cat.addSheet(spriteAnimationType.idle, "assets/sprites/cat/cat_0/cat_0_idle_1.png", {
            offsetX: 0,
            offsetY: 0,
            height: 16.5,
            width: 16,
            rate: 1,
            frameCount: 2,
            scale: 4
        });
        return cat;
    }
}