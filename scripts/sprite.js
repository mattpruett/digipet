const spriteAnimationType  = {
    idle: 0,
    walk: 1,
    fight: 2,
    eyeShift: 3
}

class spriteSheet {
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
            this.#animationSettings.frameCount = settings.frameCount   ? settings.frameCount : 0;
            this.#animationSettings.scale      = settings.scale        ? settings.scale      : 1;
            this.#animationSettings.speed      = settings.speed        ? settings.speed      : 1;
            this.#animationSettings.doMove     = settings.doMove       ? settings.doMove     : false;
            this.#animationSettings.direction  = settings.direction    ? settings.direction  : direction.right;

            this.#animationSettings.lastFrameDrawn = 0;
        }
    }

    animate(context, x, y, totalFrames, animationDirection) {
        let switchState = false;
        if (this.#animationSettings) {
            const settings = this.#animationSettings;

            // TODO: There's probably a fancy mathmatical way to solve this.
            // It would be fun to try and figure that out. But for now, this
            // is easer to follow.
            
            // Speed is how frequently we want to move on to the next frame in animation.
            // If we reached that point...
            let nextFrame = (totalFrames % settings.speed) == 0;
            let currentFrame = nextFrame
                // then, we incriment the current frame and move to the next frame
                // or reset to 0 if we reached the last frame.
                ? ++this.#animationSettings.lastFrameDrawn % settings.frameCount
                // Otherwise, we stick to whatever frame we last drew
                : this.#animationSettings.lastFrameDrawn;

            if (nextFrame) {
                const prevX = x;
                const prevY = y;
                const lateralMovement = directionIsLateral(animationDirection);
                const verticalMovement = directionIsVertical(animationDirection);
                // If we are going left, we need to subtract the width rather than add
                const slideDirX = animationDirection == direction.left ? -1 : 1;
                // If we are going up, we need to subtract the height rather than add
                const slideDirY = animationDirection == direction.up ? -1 : 1;
                

                x += lateralMovement
                    ? (settings.width * slideDirX)
                    : 0;
                
                if (lateralMovement && !this.#spriteInView(context, x + settings.width, y)) {
                    x = prevX;
                    switchState = true;
                }

                y += verticalMovement
                    ? (settings.height * slideDirY)
                    : 0;
                
                if (verticalMovement && !this.#spriteInView(context, x + settings.width, y)) {
                    y = prevY;
                    switchState = true;
                }
            }
                
            this.#animationSettings.lastFrameDrawn = currentFrame;
            let pos = this.#drawFrame(context, currentFrame, 0, x, y, this.#animationSettings, animationDirection);
            pos.switchState = switchState;
            return pos;
        }
    }
    
    #drawFrame(context, frameX, frameY, canvasX, canvasY, settings, drawDirection) {
        let width = settings.width * settings.scale;
        let height = settings.height * settings.scale;
        let scaleX = 1;
        let scaleY = 1;
        // Set scale to flip the image.
        if (!valueIsUndefined(drawDirection) && drawDirection != settings.direction) {
            scaleX = directionIsLateral(drawDirection) ? -1 : 1;
            scaleY = directionIsVertical(drawDirection) ? -1 : 1;

            context.scale(scaleX, scaleY);
        }

        // Parameters:
        //  0: the image source.
        context.drawImage(this.sheet,
            //  1: X position in the sheet.
            (settings.offsetX + (frameX * settings.width)),
            //  2: Y position in the sheet.
            settings.offsetY + (frameY * settings.height),
            //  3: Crop the width in the sheet.
            settings.width,
            //  4: Crop the height in the sheet.
            settings.height,
            //  5: x position of where to start drawing.
            canvasX * scaleX,
            //  6: Y postion of where to start drawing.
            canvasY * scaleY,
            //  7: The draw width.
            width,
            //  8: the draw height.
            height);


        return { x: canvasX, y: canvasY };
    }

    #spriteInView(context, x, y) {
        const canvas = context.canvas;
        const margin = 40;
        // Right or bottom
        return (x < (canvas.width-margin) && y < (canvas.height - margin))
        // Left or top.
        // TODO: Clean this up. The cat goes left to the edge but teleports back to the right a bit.
            && (x > margin && y > margin);
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
        return this.#doAnimation(spriteAnimationType.idle, context, x, y);
    }
    
    eyeShift(context, x, y) {
        return this.#doAnimation(spriteAnimationType.eyeShift, context, x, y);
    }
    
    walk(direction, context, x, y) {
        return this.#doAnimation(spriteAnimationType.walk, context, x, y, direction);
    }
    
    fight(context, x, y) {
        return this.#doAnimation(spriteAnimationType.fight, context, x, y);
    }

    #doAnimation(animationType, context, x, y, direction) {
        let position = { x: x, y: y, switchState: false };
        this.#animationFrameCount = this.#lastAnimation == animationType || this.#animationFrameCount >= Number.MAX_VALUE
            ? this.#animationFrameCount + 1
            : 0;

        if (!valueIsUndefined(this.#sheets[animationType])) {
            position = this.#sheets[animationType].animate(context, x, y, this.#animationFrameCount, direction);
        }
        this.#lastAnimation = animationType;
        return position;
    }

    static cat() {
        let cat = new sprite();
        const catHeight = 16;
        const catWidth = 17;
        const catScale = 4;

        cat.addSheet(spriteAnimationType.idle, "assets/sprites/cat/cat_0/cat_0_idle_1.png", {
            offsetX: 0,
            offsetY: 0,
            height: catHeight,
            width: catWidth,
            frameCount: 1,
            scale: catScale,
            speed: 1000,
            doMove: false
        });

        cat.addSheet(spriteAnimationType.eyeShift, "assets/sprites/cat/cat_0/cat_0_idle_1.png", {
            offsetX: 0,
            offsetY: 0,
            height: catHeight,
            width: catWidth,
            frameCount: 2,
            scale: catScale,
            speed: 50,
            doMove: false
        });

        cat.addSheet(spriteAnimationType.walk, "assets/sprites/cat/cat_0/cat_0_walk.png", {
            offsetX: 0,
            offsetY: 0,
            height: catHeight,
            width: catWidth,
            frameCount: 7,
            scale: catScale,
            speed: 5,
            direction: direction.right,
            doMove: true
        });
        return cat;
    }
}