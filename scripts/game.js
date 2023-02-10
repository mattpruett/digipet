class game {
    // Private
    #context = null;
    #timer = null;
    // Public
    background = new Image();

    // constructor
    constructor(canvasContext) {
        this.#context = canvasContext;
    }

    // Methods
    setBackground(imgSource) {
        this.background.src = imgSource;

        // Make sure the image is loaded first otherwise nothing will draw.
        this.background.onload = function() {
            this.#context.drawImage(background,0,0);   
        }
    }

    start(frameEvent, interval, parameters) {
        this.#timer = setInterval(frameEvent, interval, parameters);
    }
}