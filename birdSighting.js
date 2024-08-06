'use strict';

// class that saves bird sighting containing, datetime, species, rarity, number, location, url
module.exports = class BirdSighting {
    constructor(datetime, species, rarity, number, location, url) {
        this.datetime = datetime;
        this.species = species;
        this.rarity = rarity;
        this.number = number;
        this.location = location;
        this.url = url;
    }
}
