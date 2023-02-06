const direction = {
    left: 0,
    right: 1,
    up: 2,
    down: 3
}

class Need {
    // private

    // private properties
    #min = 0;
    #max = 5;
    #explosionChance = 0;
    #baseExplosionChance = 0;
    #explosionStep = 0;
    #implosionChance = 0;
    #baseImplosionChance = 0;
    #implosionStep = 0;

    // public

    // public events
    onChangeEvent = null;
    onFullEvent = null;
    onExplosionEvent = null;
    onEmptyEvent = null;
    onImplosionEvent = null;

    // public properties
    value = 0;

    constructor(value, min, max, explosionChance, explosionStep, implosionChance, implosionStep) {
        this.value = isUndefined(value) ? this.value : value;

        // Protect against a max being less than the min
        this.#min = isUndefined(min) || (min >= max) ? this.#min : min;
        this.#max = isUndefined(max) || (max <= min) ? this.#max : max;

        this.#explosionChance = isUndefined(explosionChance) ? this.#explosionChance : explosionChance;
        this.#baseExplosionChance = this.#explosionChance;

        this.#implosionChance = isUndefined(implosionChance) ? this.#implosionChance : implosionChance;
        this.#baseImplosionChance = this.#implosionChance;

        this.#explosionStep = isUndefined(explosionStep) ? this.#explosionStep : explosionStep;
        this.#implosionStep = isUndefined(implosionStep) ? this.#implosionStep : implosionStep;
    }

    // Reset back to the minimum.
    empty() {
        this.value = this.#min;

        this.__onChange();
    }

    // Add the given value to our current value
    fill (value) {
        this.setValue(value + this.value);
    }

    // Call fill to add 1 to the value
    inc() {
        this.fill(1); 
    }

    // Call fill to subtract one from the value
    dec() {
        this.fill(-1);
    }

    isFull() {
        // if max is 0, then let's not assume we are full
        return (this.value == this.#max) && (this.#max > 0);
    }

    isEmpty() {
        return this.value == this.#min;
    }

    setValue (val) {
        // Save the previous value for calling any events
        let previousValue = this.value;

        // if it is less than min or greather than max then use min or max respectively.
        let newValue = Math.min(Math.max(val, this.#min), this.#max);

        // No need to do anything if the value hasn't actually changed
        if (previousValue !== newValue) {
            this.value = newValue;
           
            // Handle any value changing events
            this.#__onChange({
                previousValue: previousValue,
                currentValue: this.value,
                maxValue: this.#max,
                minValue: this.#min
            });
        }
    }

    // we can create a common function that both #__onFull and #__onEmpty can call
    #__onThresholdReached(e, chance, baseEventChance, eventStep, thresholdReachedEvent, specialEvent) {
        if (thresholdReachedEvent) {
            // Call the event to let the implementor handle it
            thresholdReachedEvent(e);
        }

        if (specialEvent) { 
            // Check to see if we should do something.
            if (percentile(chance)) {
                // It looks like the threshold event was fired
                // Call the event to let the implementor handle it
                specialEvent(e);

                // Reset it now that we have performed the event
                return baseEventChance;
            }
            else {
                // We didn't perform the event, so let's increase the chance for next time
                return chance + eventStep;
            }
        }

        return chance;
    }

    #__onFull (e) {
        this.#explosionChance = this.#__onThresholdReached(e, this.#explosionChance, this.#baseExplosionChance, this.#explosionStep, this.onFullEvent, this.onExplosionEvent);
    }

    #__onEmpty (e) {
        this.#implosionChance = this.#__onThresholdReached(e, this.#implosionChance, this.#baseImplosionChance, this.#implosionStep, this.onEmptyEvent, this.onImplosionEvent);
    }

    #__onChange(e) {
        if (this.onChangeEvent) {
            this.onChangeEvent(e);
        }

        if (this.isFull()) {
            this.#__onFull(e);
        }

        if (this.isEmpty()) {
            this.#__onEmpty(e);
        }
    }

    toString() {
        return `${this.value}/${this.#max}`;
    }
}

class Pet {
    type;
    name;
    age = 0;
    nickName;
    health = null;
    hunger = null;
    happiness = null;
    bowels = null;
    outputLocation = null;

    constructor(outputLocation, healthThreashold, hungerThreashold, happinessThreashold, bowelsThreashold) {
        // This is a bit of a hack to work around the fact that "this" clashes when calling events.
        // I don't like it, but it's a simple solution.
        // Perhaps I can implement a better one in the future.
        let pet = this;

        this.health = new Need(10, 0, valueIsUndefined(healthThreashold) ? 10 : healthThreashold, 0, 0, 100);
        this.health.onEmptyEvent = function (e) { pet.onPetEmptyHealth(e); };
        this.health.onFullEvent = function (e) { pet.onPetFullHealth(e); };

        this.hunger = new Need(0, 0, valueIsUndefined(hungerThreashold) ? 5 : hungerThreashold, 20, 10);
        this.hunger.onEmptyEvent = function (e) { pet.onPetEmptyHunger(e); };
        this.hunger.onFullEvent = function (e) { pet.onPetFullHunger(e); };
        this.hunger.onExplosionEvent = function (e) { pet.onHaveToPuke(e); };

        this.happiness = new Need(5, 0, valueIsUndefined(happinessThreashold) ? 10 : happinessThreashold, 30, 10, 30, 10);
        this.happiness.onEmptyEvent = function (e) { pet.onPetEmptyHappiness(e); };
        this.happiness.onFullEvent = function (e) { pet.onPetFullHappiness(e); };

        this.bowels = new Need(0, 0, valueIsUndefined(bowelsThreashold) ? 5 : bowelsThreashold, 100, 0);
        this.bowels.onEmptyEvent = function (e) { pet.onPetEmptyBowels(e); };
        this.bowels.onFullEvent = function (e) { pet.onPetFullBowels(e); };

        this.outputLocation = outputLocation;
    }

    feed() {
        this.hunger.dec();
    }

    // Event implimentations
    // Health
    onPetEmptyHealth(e) {
        this.die();
    }

    onPetFullHealth(e) {
        this.do(`${this.name} is in perfect health.`);
    }

    // Hunger
    onPetEmptyHunger(e) {
        this.do(`${this.name} couldn't possibly eat another bite.`);
    }

    onPetFullHunger(e) {
        this.do(`${this.name} is starving.`);
    }

    onHaveToPuke(e) {
        this.do(`${this.name} puked. Gross`);
    }

    // Happiness
    onPetEmptyHappiness(e) {
        this.do(`${this.name} is very upset.`);
    }

    onPetFullHappiness(e) {
        this.do(`${this.name} is bursting with happines!`);
    }

    // Bowels
    onPetEmptyBowels(e) {
        this.do(`${this.name} Feels much better.`);
    }

    onPetFullBowels(e) {
        this.do(`${this.name} pooped. Yuck!`);
    }

    // pet actions
    cheer() {
        this.do(`${this.name} cheers! Hurray!`);
    }

    dance() {
        this.do(`${this.name} dances a happy little dance`);
    }

    die () {
        this.do(`${this.name} died! RIP`);
    }

    move(where) {
        switch(where) {
            case direction.left:
                this.do(`${this.name} moved left`);
                break;
            
            case direction.right:
                this.do(`${this.name} moved right`);
                break;
            
            case direction.up:
                this.do(`${this.name} moved up`);
                break;            
            
            case direction.down:
                this.do(`${this.name} moved down`);
                break;
        }
    }

    getStatsAsHtml() {
        let table = $("<table style='width:100%'></table>");

        table.append("<tr><th>Name</th><th>Health</th><th>Hunger</th><th>Happiness</th><th>Bowels</th></tr>");
        
        let row = $("<tr></tr>");
        // name
        row.append(`<td>${this.name}</td>`);
        // health
        row.append(`<td>${this.health}</td>`);
        // hunger
        row.append(`<td>${this.hunger}</td>`);
        // happiness
        row.append(`<td>${this.happiness}</td>`);
        // bowels
        row.append(`<td>${this.bowels}</td>`);

        table.append(row);

        return table.html();
    }

    do(what) {
        // TODO: Eventually we will have fun visual stuff going on here.
        if (!isUndefined(this.outputLocation)) {
            this.outputLocation.text(what);
        }
        else {
            console.log(what);
        }
    }
    // Some helper methods and overrides
    getStatsAsString() {
        return `${this.name}\r\n\tHealth: ${this.health}\r\n\tHunger: ${this.hunger}\r\n\tHappiness ${this.happiness}\r\n\tBowels: ${this.bowels}`;
    }

    toString() {
        return this.getStatsAsString();
    }

    toHtml() {
        return this.getStatsAsHtml();
    }
}