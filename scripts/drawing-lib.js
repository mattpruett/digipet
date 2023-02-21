// Drawing documentation:
//  - https://spicyyoghurt.com/tutorials/html5-javascript-game-development/images-and-sprite-animations
//  - https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
//  - https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/stroke
function setCanvasContextBackroundImage(context, imageLocation, width, height) {
    if (imageLocation && context) {
        var background = new Image();
        background.src = imageLocation;
        
        // Make sure the image is loaded first otherwise nothing will draw.
        background.onload = function(){

            if (width && height) {
                context.drawImage(background,0,0, width, height);
            }
            else {
                context.drawImage(background,0,0);
            }
        }
    }
}