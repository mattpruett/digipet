function getRandomRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const coinHeads = "heads";
const coinTails = "tails";

function flipACoin(challenge) {
    // TODO
    // We may want to test against type here. It may not be a string
    // For now, we'll assume it's one of the coin const values
    let desiredValue = challenge.toLowerCase() === "heads"
        ? 0
        : 1;

    return chance(desiredValue, 0, 1);
}

function chance(targetValue, min, max) {
    return getRandomRange(min, max) <= targetValue;
}

function percentile(targetValue) {
    return chance(targetValue, 1, 100);
}