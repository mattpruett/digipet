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
}