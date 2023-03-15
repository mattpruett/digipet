// Some future considerations:
//  - Use GUIDs in all Ids so we can truly have multiple game instances running
//    without ID clashing.


// Some globals.
var gameLoop;

// Helper functions.

// This should allow us to take a div and call it like a Jquery method.
function initializeGame(frequencyMS) {
    let container = $('<div style="width:100%;">');
    container.append($('<input type="button" value="Feed Pet" onclick="feedPet();"/>'));
    container.append($('<input type="button" value="Starve Pet" onclick="starvePet();"/>'));
    container.append($('<div id="pet-stats" style="width:100%" class="digital"></div><br/>'));

    let content = $('<div class="row">');
    content.append($(
    '<div class="col-md-8" id="game-screen">'+
    '   <canvas id="canvas" height="400" style="border:1px solid lightgray;background-color: lightpink;">'+
    '       Your browser does not support the HTML5 canvas tag.'+
    '   </canvas>'+
    `   <script>game.gameRendered(${frequencyMS});</script>`+
    '</div>'));

    let gameLog = $('<div class="col-md-4" id="pet-output">');
    content.append(gameLog);

    container.append(content);

    this.append(container);
    frameFrequency = frequencyMS;
    return this;
};

class game {
    // Private
    #timer = null;
    #totalTicks = 0;

    // Public
    background = new Image();
    canvas = null;
    context = null;
    pet = null;
    logger = null;
    toolBar = new gameToolBar();

    // constructor
    constructor() {
        this.logger = new gameLogger($("#pet-output"));
        this.pet = new Pet(this.logger, petType.cat);
        this.pet.name = "Link";
        this.refreshPetStats();
        this.canvas = document.getElementById('canvas');
        this.context = canvas.getContext('2d');

        let width = $("#game-screen").innerWidth();
        let height = $("#game-screen").innerHeight();
        this.context.canvas.width  = width;

        this.pet.setLocation({x: 400, y: 300});
        
        this.toolBar.addButton(new gameToolBarButton(this.canvas, "assets/other/hamburger.png", true));
        
        this.setBackground("assets/backgrounds/livingroom/livingroom.jpg", width, height);

        let gameObject = this;
        // Set events
        canvas.onmousemove = function(e) { game.__mouseMove(e, gameObject); };
    }

    // Methods
    setBackground(imgSource, width, height) {
        this.background.src = imgSource;
        // Another alies to make it all work.
        let game = this;
        // Make sure the image is loaded first otherwise nothing will draw.
        this.background.onload = function() {
            if (width && height) {
                game.context.drawImage(game.background,0,0, width, height);
            }
            else {
                game.context.drawImage(game.background,0,0);
            }
            game.drawToolbar();
            game.pet.idle(game.context);
        };
    }

    onBackgroundLoad() {
        if (width && height) {
            this.context.drawImage(this.background,0,0, width, height);
        }
        else {
            this.context.drawImage(this.background,0,0);
        }
    }

    refreshPetStats() {
        $("#pet-stats").html(this.pet.toHtml());
    }
    
    doGameLoop() {
        // Every 300 ticks - or 5 seconds - we are going to have the pet do its thing.
        const petTimerTickInterval = 300;

        this.clearCanvas();

        this.refresh();


        // If this is the 10th time, call the pets tick event.
        if ((this.#totalTicks % petTimerTickInterval) === 0) {
            this.pet.timerTicked();
            // Then redraw the pet and stats.
            this.refreshPetStats();
        }
        this.#totalTicks++;
    }

    drawToolbar () {
        this.toolBar.draw(this.context, 20, 20);
    }

    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    refresh() {
        this.drawBackground();
        this.pet.draw(this.context);
        this.drawToolbar();
    }

    drawBackground() {
        let width = $("#game-screen").innerWidth();
        let height = $("#game-screen").innerHeight();
        this.context.canvas.width  = width;
        this.context.drawImage(this.background,0,0, width, height);
    }

    start() {
        window.requestAnimationFrame(game.gameStep);
    }

    // Mouse functions


    // Static functions.
    static gameRendered(frequency) {
        gameLoop = new game();
        gameLoop.start();        
    }

    static gameStep(timeStamp) {
        gameLoop.doGameLoop();
        window.requestAnimationFrame(game.gameStep);
    }

    static __mouseMove(e, game) {
        // Do we need to decide the default cursor here        
        canvas.style.cursor = "default";
        refreshCoordinates(e.pageX, e.pageY);
        if (game.toolBar.mouseInRect(e)) {
            e.game = game;
            game.toolBar.handleMouseMove(e);
        }
    }
}

class gameToolBar {
    // Public
    buttons = [];
    posX = 5;
    posY = 5;
    margins = 5;

    // Private
    #toolbarWidth() {
        let width = this.buttons.length  > 0 ? this.margins : 0;
        for(let i = 0; i < this.buttons.length; i++) {
            width += this.buttons[i].width + this.margins;
        }
        return width;
    }

    #toolbarHeight() {
        let height = this.buttons.length > 0
            // Find the button in our list with the largest height.
            ? Math.max.apply(Math, this.buttons.map(function(btn) { return btn.height; }))
            : 0;
        // Margins x 2 = top and bottom.
        return height + (this.margins * 2);
    }

    #toolbarRect() {
        const rect = canvas.getBoundingClientRect();
        
        return {
            left: rect.left + this.posX,
            top: rect.top + this.posY,
            width: this.#toolbarWidth(),
            height: this.#toolbarHeight()
        };
    }

    addButton(button) {
        if (button instanceof gameToolBarButton) {
            this.buttons.push(button);
        }
    }

    draw(context, offsetX, offsetY) {
        this.posX = offsetX;
        this.posY = offsetY;
        this.#drawBar(context, offsetX, offsetY);
    }

    // Event responses
    handleMouseMove(e) {
        for(let i = 0; i < this.buttons.length; i++) {
            if (gameToolBarButton.mouseInRect(e, this.buttons[i])) {
                canvas.style.cursor = "pointer";
                return;
            }
        }
    }

    #drawBar(context, offsetX, offsetY) {
        // Set transparency value
        context.globalAlpha = 0.35;

        context.fillStyle = 'magenta';
        const width = this.#toolbarWidth();
        const height = this.#toolbarHeight();
        context.roundRect(offsetX, offsetY, width, height, [7.5]);
        context.fill();

        // Set transparency value
        context.globalAlpha = 1;

        this.#drawButtons(context, offsetX, offsetY);
    }
    
    #drawButtons(context, offsetX, offsetY) {
        let dx = offsetX + this.margins;
        const dy = offsetY + this.margins;
        if (context) {
            for (let i = 0; i < this.buttons.length; i++) {
                let button = this.buttons[i];
                button.x = dx;
                button.y = dy;
                button.draw(context, dx, dy);
                dx += button.width + this.margins;
            }
        }
    }

    // Mouse and similar helper functions
    pointInRect(pos) {
        const rect = this.#toolbarRect();
        const right = rect.left + rect.width;
        const bottom = rect.top + rect.height;

        // Past the left.
        return pos.x > rect.left 
            // Below the top.
            && pos.y > rect.top 
            // Not beyond the right.
            && pos.x < right 
            // And not past the bottom.
            && pos.y < bottom;
    }

    mouseInRect(e) {        
        return this.pointInRect({
            x: e.pageX,
            y: e.pageY
        });
    }
}

class gameToolBarButton {
    // Public
    width = 30;
    height = 30;
    image = new Image();
    x = 0;
    y = 0;
    draggable = false;

    // Private
    __startX = 0;
    __startY = 0;

    constructor(canvas, imageLocation, draggable) {
        //let button = this;
        this.image.src = imageLocation;
        this.draggable = valueIsUndefined(draggable) ? false : draggable;

        //canvas.onmousemove = function(e) { gameToolBarButton.__mouseMove(e, button); };
        //canvas.on('mousemove', function(e) { gameToolBarButton.__mouseMove(e, button); }).onmouseup = myUp;
        //canvas.on('mousemove', function(e) { gameToolBarButton.__mouseMove(e, button); })
        
        //.onmousemove = myMove;

    }

    draw(context, x, y) {
        this.x = x;
        this.y = y;
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    getButtonClientRect(canvas) {
        const rect = canvas.getBoundingClientRect();

        return {
            x: rect.left + this.x,
            y: rect.top + this.y,
            width: this.width,
            height: this.height
        }
    }

    static __mouseMove(e, button) {
        canvas.style.cursor = gameToolBarButton.mouseInRect(e, button)
            // Draw a pointer cursor.
            ? "pointer"
            // Otherwise, draw the default cursor.
            : "default";
    }

    static __mouseDown(e, button) {
        // tell the browser we're handling this mouse event
        e.preventDefault();
        e.stopPropagation();

        if (button.draggable && gameToolBarButton.mouseInRect(e, button)) {
            debugger;
            // Tell the game object (perhaps through an event)
            // that it now has an object in hand.
            // Maybe make a new class to handle the logic of drag and dropping
            // and what it should do.
            // It neeeds to perform these steps:
            // Clone button.
            // And drag it around
        }

        // save the current mouse position
        button.__startX = mouseX;
        button.__startY = my;
    }

    static __mouseUp(e, button) {
        // TODO
    }

    static #pointInRect(mousePos, buttonRect) {
        const right = buttonRect.left + buttonRect.width;
        const bottom = buttonRect.top + buttonRect.height;

        // Past the left.
        return mousePos.x > buttonRect.left 
            // Below the top.
            && mousePos.y > buttonRect.top 
            // Not beyond the right.
            && mousePos.x < right 
            // And not past the bottom.
            && mousePos.y < bottom;
    }

    static mouseInRect(e, button) {
        const rect = button.getButtonClientRect(canvas);
        return gameToolBarButton.#pointInRect({
            x: e.pageX,
            y: e.pageY
        }, {
            left: rect.x,
            top: rect.y,
            width: button.width,
            height: button.height
        });
    }
}