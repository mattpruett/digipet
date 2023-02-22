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
    Pet = null;
    logger = null;
    toolBar = new gameToolBar();

    // constructor
    constructor() {
        this.logger = new gameLogger($("#pet-output"));
        this.Pet = new Pet(this.logger, petType.cat);
        this.Pet.name = "Link";
        this.refreshPetStats();
        this.canvas = document.getElementById('canvas');
        this.context = canvas.getContext('2d');

        let width = $("#game-screen").innerWidth();
        let height = $("#game-screen").innerHeight();
        this.context.canvas.width  = width;
        
        this.toolBar.addButton(new gameToolBarButton("assets/other/hamburger.png"));
        
        this.setBackground("assets/backgrounds/livingroom/livingroom.jpg", width, height);
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
        };
    }

    start(interval, parameters) {
        this.#timer = setInterval(function (params) { params.doGameLoop(); }, interval, this);
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
        $("#pet-stats").html(this.Pet.toHtml());
    }
    
    doGameLoop() {
        // Every 10 ticks - or 10 seconds - we are going to have the pet do its thing.
        const petTimerTickInterval = 10;

        // If this is the 10th time, call the pets tick event.
        if ((this.#totalTicks % petTimerTickInterval) === 0) {
            this.Pet.timerTicked();
            // Then redraw the pet and stats.
            this.refreshPetStats();
        }
        this.#totalTicks++;
    }

    refresh() {
        let width = $("#game-screen").innerWidth();
        let height = $("#game-screen").innerHeight();
        this.context.canvas.width  = width;
        this.context.drawImage(this.background, 0, 0, width, height);
    }

    static gameRendered(frequency) {
        gameLoop = new game();
        gameLoop.start(frequency);        
    }

    drawToolbar () {
        this.toolBar.draw(this.context, 20, 20);
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
            // Find the button in our listh with the largest height.
            ? Math.max.apply(Math, this.buttons.map(function(btn) { return btn.height; }))
            : 0;
        // Margins x 2 = top and bottom.
        return height + (this.margins * 2);
    }

    addButton(button) {
        if (button instanceof gameToolBarButton) {
            this.buttons.push(button);
        }
    }

    draw(context, offsetX, offsetY) {
        this.#drawBar(context, offsetX, offsetY);
    }

    #drawBar(context, offsetX, offsetY) {
        // Set transparency value
        context.globalAlpha = 0.35;

        context.fillStyle = 'magenta';
        const width = this.#toolbarWidth();
        const height = this.#toolbarHeight();
        context.roundRect(offsetX, offsetY, width, height, [7.5]);
        context.fill();
        //context.fillRect(offsetX, offsetY, width, height);

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
}

class gameToolBarButton {
    // Public
    width = 30;
    height = 30;
    image = new Image();
    x = 0;
    y = 0;

    constructor(imageLocation) {
        let button = this;
        this.image.src = imageLocation;
        $(document).on('mousemove', function(e) { gameToolBarButton.__mouseMove(e, button); });

    }

    draw(context, x, y) {
        this.x = x;
        this.y = y;
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    static __mouseMove(e, button) {
        const rect = canvas.getBoundingClientRect();

        const x = rect.left + button.x;
        const y = rect.top + button.y;

        const cX = e.pageX;
        const cY = e.pageY;
        

        // If pointer is hovering over the button.
        canvas.style.cursor = gameToolBarButton.#pointInRect({
            x: e.pageX,
            y: e.pageY
        }, {
            left: x,
            top: y,
            width: button.width,
            height: button.height
        })
            // Draw a pointer cursor.
            ? "pointer"
            // Otherwise, draw the default cursor/
            : "default";
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
}