'use strict';

class Suunnistus {
    nimi = "";
    koodi;
    rastit = new Rastit();
    
    constructor(nimi) {
        this.nimi = nimi;
        // Tää pitää säätää sit.
        this.koodi = 1;
    }
    

    getRastit() {
        return this.rastit.getRastit();
    }

    lisaaRasti(rasti) {
        this.rastit.push(rasti);
    }

    setRastit(rastit) {
        this.rastit = rastit;
    }

    tallennaSuunnistus(data) {
        let localData = JSON.stringify(data);
        firebase.database().ref('reitit/' + this.nimi).set(localData);
    }
}

class Rastit {
    rastit = [];
    lkm = 0;

    getRastit() {
        return this.rastit;
    }

    lisaaRasti(rasti) {
        rasti.id = this.lkm + 1;
        this.lkm++;
        this.rastit.push(rasti);
    }

    // Ottaa vastaan {lat, lon} objektin
    // Palauttaa rastin tossa paikassa
    getRastiLatLon(latlon) {
        let rasti = this.rastit.find(rasti => {
            return rasti.getLat() == latlon.lat && rasti.getLon() == latlon.lng;
        })

        if (rasti) return rasti;
        else return -1;
    }

    getRastiId(id) {
        let rasti = this.rastit.find(rasti => {
            return rasti.getId() == id;
        });
        return rasti;
    }
  
}

class Rasti {
    lat;
    lon;
    id;
    tehtava = "";

    constructor(lat,lon) {
        this.lat = lat;
        this.lon = lon;
    }

    getLat() {
        return this.lat;
    }

    getLon() {
        return this.lon;
    }

    getId() {
        return this.id;
    }
    
    getTehtava() {
        return this.tehtava;
    }

    // Varmaan mielellään tällä hetkellä stringi, tulevaisuudessa vois tehäd oman olion.
    setTehtava(tehtava) {
        this.tehtava = tehtava;
    }

    tulostaRasti() {
        return "Rasti: " + this.id + ", Lat: " + this.lat + ", Lon: " + this.lon;
    }

    getLatLon() {
        return {lat: this.lat, lng: this.lon};
    }
}

class Opettaja {
    etunimi;
    sukunimi;

    constructor(etunimi, sukunimi) {
        this.etunimi = etunimi;
        this.sukunimi = sukunimi;
    }
}

class Oppilas {
    lempinimi;

    constructor(lempinimi) {
        this.lempinimi = lempinimi;
    }
}