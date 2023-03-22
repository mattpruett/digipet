// Some future considerations:
//  - Use GUIDs in all Ids so we can truly have multiple game instances running
//    without ID clashing.


// Some globals.
var gameLoop;

// Helper functions.

// This should allow us to take a div and call it like a Jquery method.
function initializeGame() {
    let container = $('<div style="width:100%;">');
    container.append($('<input type="button" value="Feed Pet" onclick="feedPet();"/>'));
    container.append($('<input type="button" value="Starve Pet" onclick="starvePet();"/>'));
    container.append($('<input type="button" value="Kill Pet" onclick="killPet();"/>'));
    container.append($('<div id="pet-stats" style="width:100%" class="digital"></div><br/>'));

    let content = $('<div class="row">');
    content.append($(
    '<div class="col-md-8" id="game-screen">'+
    '   <canvas id="canvas" height="400" style="border:1px solid lightgray;background-color: lightpink;">'+
    '       Your browser does not support the HTML5 canvas tag.'+
    '   </canvas>'+
    `   <script>game.gameRendered();</script>`+
    '</div>'));

    // TODO: Make the game log scrollable and don't allow for resize when content gets too big.
    let gameLog = $('<div class="col-md-4" id="pet-output">');
    content.append(gameLog);

    container.append(content);

    this.append(container);
    return this;
};

class game {
    // Private
    #totalTicks = 0;

    // Public
    background = new Image();
    canvas = null;
    context = null;
    dragTool = null;
    logger = null;
    pet = null;
    toolBar = new gameToolBar();

    constructor() {
        this.logger = new gameLogger($("#pet-output"));
        this.pet = new Pet(this.logger, petType.cat);
        this.pet.name = "Link";
        this.pet.game = this;
        this.refreshPetStats();
        this.canvas = document.getElementById('canvas');
        this.context = canvas.getContext('2d');

        let width = $("#game-screen").innerWidth();
        let height = $("#game-screen").innerHeight();
        this.context.canvas.width  = width;

        this.pet.setLocation({x: 400, y: 300});
        
        this.#initializeToolbar();

        this.setBackground("assets/backgrounds/livingroom/livingroom.jpg", width, height);

        let gameObject = this;
        // Set events
        canvas.onmousedown = function(e) { e.canvas = canvas; e.game = gameObject; game.__mouseDown(e); };
        canvas.onmousemove = function(e) { e.canvas = canvas; e.game = gameObject; game.__mouseMove(e); };
        canvas.onmouseout = function(e) { gameObject.clearDragTool(); };
        canvas.onmouseup = function(e) { e.canvas = canvas; e.game = gameObject; game.__mouseUp(e); };
    }

    // Public methods.
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clearDragTool() {
        this.dragTool = null;
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

    drawBackground() {
        let width = $("#game-screen").innerWidth();
        let height = $("#game-screen").innerHeight();
        this.context.canvas.width  = width;
        this.context.drawImage(this.background,0,0, width, height);
    }

    drawToolbar () {
        this.toolBar.draw(this.context, 20, 20);
    }

    mouseOverPet(e) {
        return this.pet.mouseInRect(e);
    }

    refresh() {
        this.drawBackground();
        this.pet.draw(this.context);
        this.drawToolbar();
        if (this.dragTool) {
            this.dragTool.draw(this.context);
        }
    }

    refreshPetStats() {
        $("#pet-stats").html(this.pet.toHtml());
    }

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

    setDragTool(tool) {
        this.dragTool = tool;
    }

    start() {
        window.requestAnimationFrame(game.gameStep);
    }

    // Private functions
    #initializeToolbar() {
        let feedingButton = new gameToolBarButton(this.canvas, "assets/other/hamburger.png", true);
        this.toolBar.addButton(feedingButton);
        gameTool.createFromAndApplyToButton(feedingButton, true, gameToolType.feed);
    }

    updateDragToolCoordiates(mouseX, mouseY) {
        // if the drag flag is set, clear the canvas and draw the image
        if(this.dragTool != null) {
            let pos = mouseToCanvasPosition(this.canvas, mouseX, mouseY);

            this.dragTool.x = pos.x;
            this.dragTool.y = pos.y;
        }
    }

    // Static functions.
    static gameRendered() {
        gameLoop = new game();
        gameLoop.start();        
    }

    static gameStep(timeStamp) {
        gameLoop.doGameLoop();
        window.requestAnimationFrame(game.gameStep);
    }

    // Events.
    onBackgroundLoad() {
        if (width && height) {
            this.context.drawImage(this.background,0,0, width, height);
        }
        else {
            this.context.drawImage(this.background,0,0);
        }
    }

    // Static methods.

    // Mouse methods.
    static __mouseDown(e) {
        if (e.game.toolBar.mouseInRect(e)) {
            e.game.toolBar.handleMouseDown(e);
        }
    }

    static __mouseMove(e) {
        // Do we need to decide the default cursor here
        canvas.style.cursor = "default";
        refreshCoordinates(e.pageX, e.pageY);
        // We are dragging here.
        if (e.game.dragTool != null) {
            e.game.updateDragToolCoordiates(e.clientX, e.clientY);
            if (e.game.mouseOverPet(e)) {
                // TODO
                e.game.pet.feed();
                e.game.clearDragTool();
            }
        }
        else if (e.game.toolBar.mouseInRect(e)) {
            e.game.toolBar.handleMouseMove(e);
        }
    }

    static __mouseUp(e) {
        // Do we need to decide the default cursor here
        if (e.game.toolBar.mouseInRect(e)) {
            e.game.toolBar.handleMouseMove(e);
        }
        else {
            e.game.clearDragTool();
        }
    }
}

class gameToolBar {
    // Public
    buttons = [];
    posX = 5;
    posY = 5;
    margins = 5;

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
    handleMouseDown(e) {
        for(let i = 0; i < this.buttons.length; i++) {
            if (gameToolBarButton.mouseInRect(e, this.buttons[i])) {
                this.buttons[i].__mouseDown(e);
                return;
            }
        }
    }

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
    mouseInRect(e) {   
        const point = {
            x: e.pageX,
            y: e.pageY
        };
        const rect = this.#toolbarRect();     
        return pointInRect(point, rect);
    }

    // Private methods
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

    #toolbarWidth() {
        let width = this.buttons.length  > 0 ? this.margins : 0;
        for(let i = 0; i < this.buttons.length; i++) {
            width += this.buttons[i].width + this.margins;
        }
        return width;
    }
}

class gameToolBarButton {
    // Public
    width = 30;
    height = 30;
    image = new Image();
    x = 0;
    y = 0;
    tool = null;

    constructor(canvas, imageLocation) {
        //let button = this;
        this.image.src = imageLocation;
    }

    // Public methods
    draw(context, x, y) {
        this.x = x;
        this.y = y;
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    getButtonClientRect(canvas) {
        const rect = canvas.getBoundingClientRect();

        return {
            left: rect.left + this.x,
            top: rect.top + this.y,
            width: this.width,
            height: this.height
        }
    }

    // These should be private, but we propagate them from the toolbar.
    __mouseDown(e) {
        // tell the browser we're handling this mouse event
        e.preventDefault();
        /*
        e.preventDefault();
        e.stopPropagation();
        */

        if (this.tool && this.tool.draggable && e.game) {
            // Tell the game object that it now has an object in hand.
            e.game.setDragTool(this.tool);
        }
    }

    // Public static methods and events

    static __mouseUp(e) {
        if (e.game && e.game.dragTool) {
            e.game.clearDragTool();
        }
    }

    static __mouseMove(e, button) {
        canvas.style.cursor = gameToolBarButton.mouseInRect(e, button)
            // Draw a pointer cursor.
            ? "pointer"
            // Otherwise, draw the default cursor.
            : "default";
    }

    static mouseInRect(e, button) {
        const point = {
            x: e.pageX,
            y: e.pageY
        };
        const rect = button.getButtonClientRect(canvas);
        return pointInRect(point, rect);
    }
}