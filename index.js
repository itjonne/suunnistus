'use strict'

let map
let suunnistus = new Suunnistus('testi');
let reitti = [];
let edellinenRata;
let current_position;
let current_position_marker;

window.onload = function () {
  luoKartta('map');
  lataaKunnat('kunnat.json');
  // Lataa ja sijoittaa edelliseenrataan kun valmis
  lataaRadat();
  rastiButtonHandler();
  tallennaRastitReitiksiButtonHandler();
  formSubmitHandler();
  otsikkoClickHandler();
  console.log(suunnistus.getRastit());
  console.log(suunnistus);
}

// https://gis.stackexchange.com/questions/182068/getting-current-user-location-automatically-every-x-seconds-to-put-on-leaflet
function onLocationFound(e) {
  // if position defined, then remove the existing position marker and accuracy circle from the map
  if (current_position) {
    map.removeLayer(current_position_marker);
      //map.removeLayer(current_accuracy);
  }

  current_position_marker = L.marker(e.latlng).addTo(map)
    .bindPopup("Olet tässä !").openPopup();

  current_position = e.latlng;
  let paikka = document.getElementById('userPosition');
  paikka.textContent = current_position;
}

function onLocationError(e) {
  alert(e.message);
}

// wrap map.locate in a function    
function locate() {
  map.locate({setView: true, maxZoom: 16});
}

// call locate every 3 seconds... forever
setInterval(locate, 3000);


function otsikkoClickHandler() {
  let otsikko = document.getElementById('rastit-otsikko');
  otsikko.addEventListener('click', (e) => {
    e.preventDefault();
    console.log(suunnistus.getRastit());
  }) 
}

function tallennaRastitReitiksiButtonHandler() {
  let button = document.getElementById('tallennaRastitReitiksi');
  button.addEventListener('click', (e) => {
    e.preventDefault();
    naytaRastitReittina();

    suunnistus.tallennaSuunnistus(suunnistus);
  });

  console.log(suunnistus.getRastit());
}

function naytaRastitReittina() {
  let paikka = document.getElementById('rastitTiedotUl');
  suunnistus.getRastit().forEach(rasti => {
    let li = document.createElement('li');
    li.textContent = rasti.tulostaRasti() + rasti.getTehtava();
    paikka.append(li);
  })
}

function formSubmitHandler() {
  let form = document.getElementById('rastit-form');
  form.addEventListener('submit', tallennaRasti);
}

function tallennaRasti(event) {
  event.preventDefault();
  
  console.log(event.target);
  let id = event.target[0].value;
  let lat = event.target[1].value;
  let lon = event.target[2]. value;
  let tehtava = event.target[3].value;

  let rasti = suunnistus.getRastit().getRastiId(+id);
  if (rasti) {
    console.log(rasti);
    rasti.setTehtava(tehtava);
    console.log(rasti);
  }
  else {
    console.log('joku ei rastissa täsmää');
  }
  // Lopuksi resetoidaan form
  let form = document.getElementById('rastit-form');
  form.reset();
}

function rastiButtonHandler () {
  let button = document.getElementById('lisaaRasti')

  button.addEventListener('click', function () {
    let loytynyt = false;
    // Tää testaa onko paikassa jo rasti, nyt toimii vaa mapin keskustaan TODO:
    if (suunnistus.getRastit().length != 0) {
      let keskusta = map.getCenter();
      let rastit = suunnistus.getRastit();
      rastit.forEach((rasti) => {   
        if (rasti.getLat() == keskusta.lat && rasti.getLon() == keskusta.lng) {
          console.log('on jo!');
          loytynyt = true;
        }
      })
    }
    
    if (loytynyt == false) {
      let circle = L.circle(map.getCenter(), {
        color: 'red',
        radius: 150
      }).addTo(map)
  
      let latlon = circle.getLatLng();
      let rasti = new Rasti(latlon.lat, latlon.lng);
      suunnistus.rastit.lisaaRasti(rasti)
  
      circle.on({
        mousedown: function () {
          map.dragging.disable()
          map.on('mousemove', function (e) {
            circle.setLatLng(e.latlng)
            rasti.lat = e.latlng.lat
            rasti.lon = e.latlng.lng
          })
        }
      })
  
      circle.on({click: function() {      
        let rasti = haeRastiPaikasta(circle.getLatLng());
        // joko tiedot/form tällä hetkellä
        naytaRastinTiedot(rasti, "form");
      }})
  
      
      map.on('mouseup', function (e) {
        map.dragging.enable()
        map.removeEventListener('mousemove')
        paivitaRastit()
      })
      paivitaRastit()
    }
    
  })
}

function haeRastiPaikasta(latlon) {
  return suunnistus.rastit.getRastiLatLon(latlon);
}

function LogRastit() {
  console.log(suunnistus.getRastit());
}

// joko rasti-objekti
// Tai -1 jos ei oo löytyny
function naytaRastinTiedot(rasti, paikka) {
  if (rasti == -1) return;
  else {
    if (paikka === "tiedot") {
      let paikka = document.getElementById('rastitTiedotUl');
      let li = document.createElement('li');
      li.textContent = rasti.tulostaRasti();
      paikka.append(li);
      return;
    }
    if (paikka === "form") {
      let paikka = document.getElementById('rastit-form');
      let inputs = paikka.querySelectorAll('input');
      let textarea = document.getElementById('tehtava');
      
      inputs[0].value = rasti.getId();
      inputs[1].value = rasti.getLat();
      inputs[2].value = rasti.getLon();
      textarea.value = rasti.getTehtava();
    }   
  }
}

function luoKartta (paikka) {
  map = new L.map(paikka, {
    crs: L.TileLayer.MML.get3067Proj()
  }).setView([62.2333, 25.7333], 11)
  L.tileLayer.mml_wmts({ layer: 'maastokartta' }).addTo(map)

  map.on('locationfound', onLocationFound);
  map.on('locationerror', onLocationError);

  /*
map.on('click', function(e) {
     console.log('klikattu');
     let paikka = map.mouseEventToLatLng(e.originalEvent);
     uusiRasti(paikka.lat, paikka.lng);
     let circle = L.circle(
       [paikka.lat, paikka.lng], {
         color: 'red',
         radius: 150
       }
     ).addTo(map);
    
    // TODO: SIIRTÄMINEN
    circle.on('click', function(e) {
      console.log('siirto vielä puuttuu');               
      });
     
   });
   */
}

function paivitaRastit () {
  let ul = document.getElementById('rastitUl')
  let rastiKoordinaatit = [];

  while (ul.firstChild) {
    ul.removeChild(ul.firstChild)
  }
  for (let rasti of suunnistus.getRastit()) {
    let koordinaatti = [];
    koordinaatti.push(rasti.getLat());
    koordinaatti.push(rasti.getLon());
    rastiKoordinaatit.push(koordinaatti);
    let li = document.createElement('li')
    li.textContent = rasti.tulostaRasti()
    ul.append(li)
  }
  if (reitti.length != 0) {
    reitti.forEach(reitti => {
      reitti.remove(map);
    })
    reitti = [];
  }
  let polyline = L.polyline(rastiKoordinaatit, {color: 'red'}).addTo(map);
  reitti.push(polyline);
  console.log(reitti);
}

function handleFormSubmit(event) {
  event.preventDefault();
  console.log(event);
}

function lataaKunnat(tiedosto) {
  $.ajax({
    url: tiedosto,
    method: 'GET',
    dataType: 'json',
    success: function (data) {
      $.each(data, function (index, municipality) {
        if (municipality.Kunta === 'Jyväskylä') {
          $('#selector').append(
            '<option data-lat="' +
              municipality.Latitude +
              '" data-lon="' +
              municipality.Longitude +
              '" selected>' +
              municipality.Kunta +
              '</option>'
          )
        } else {
          $('#selector').append(
            '<option data-lat="' +
              municipality.Latitude +
              '" data-lon="' +
              municipality.Longitude +
              '">' +
              municipality.Kunta +
              '</option>'
          )
        }
      })
      lisaaKuntaValikko()
    },
    error: function (e) {
      alert('Error: ' + e)
    }
  })
}

function lataaRadat() {
 console.log('yritetään ladata radat');
 // return firebase jne.
 // https://firebase.google.com/docs/database/web/read-and-write?authuser=0
 firebase.database().ref('/reitit/' + suunnistus.nimi).once('value').then(function(snapshot) {
  console.log(JSON.parse(snapshot.val()));
  edellinenRata = JSON.parse(snapshot.val());
  naytaEdellinenRata();
});
}

function naytaEdellinenRata() {
    let rata = [];
    edellinenRata.rastit.rastit.forEach(rasti => {
      rata.push([rasti.lat, rasti.lon]);
      let circle = L.circle([rasti.lat, rasti.lon], {
        color: 'red',
        radius: 150
      }).addTo(map)
    })


    let polyline = L.polyline(rata, {color: 'red'}).addTo(map);
    
}

function lisaaKuntaValikko () {
  let select = document.getElementById('selector')
  select.onchange = function () {
    let valittuIndex = this.selectedIndex
    let valittu = this.options[valittuIndex]
    let valittuLatLon = [
      parseFloat(valittu.getAttribute('data-lat')),
      parseFloat(valittu.getAttribute('data-lon'))
    ]
    map.setView(valittuLatLon, 8)
  }
  let valittuIndex = select.selectedIndex
  let valittu = select.options[valittuIndex]
  let valittuLatLon = [
    parseFloat(valittu.getAttribute('data-lat')),
    parseFloat(valittu.getAttribute('data-lon'))
  ]
  map.setView(valittuLatLon, 8)
}
