/* Leafletdraw to 1 database and back */

// initialize Leaflet

let transport = L.tileLayer('https://api.mapbox.com/styles/v1/winniatthepark/ckk518ast0a7o17paz5r7bros/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoid2lubmlhdHRoZXBhcmsiLCJhIjoiY2tocWxwYjB3MGFkeTJxcGJ6cDZzd285NCJ9.gZ7tGDVxt_ArW9WptTgK8A', {
	attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors </a> ',
	accessToken: 'pk.eyJ1Ijoid2lubmlhdHRoZXBhcmsiLCJhIjoiY2tocWxwYjB3MGFkeTJxcGJ6cDZzd285NCJ9.gZ7tGDVxt_ArW9WptTgK8A',
});

mapLink = '<a href="http://www.esri.com/">Esri</a>';
wholink = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

let satellite = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: '&copy; ' + mapLink + ', ' + wholink

});

let map = L.map('map', {
	center: [-24.64443, 25.9249],
	zoom: 15,
	layers: [transport]
});


let baseMaps = {
	"Roads": transport,
	"Satellite": satellite
};

let cartoData = L.layerGroup().addTo(map);

let overlayMaps = {
	"Stops": cartoData
}

L.control.layers(baseMaps, overlayMaps).addTo(map);

// Draw

let drawnItems = L.featureGroup().addTo(map);
map.addLayer(drawnItems)

drawControl = new L.Control.Draw({
	draw: {
		polygon: false,
		polyline: false,
		rectangle: false,
		circle: false,
		circlemarker: false,
		marker: true
	},
	edit: {
		featureGroup: drawnItems,
	}

}).addTo(map);


L.drawLocal.draw.toolbar.buttons.marker = 'place a stop';

var drawControlEditOnly = new L.Control.Draw({
	edit: {
		featureGroup: drawnItems
	},
	draw: false
});

map.addControl(drawControl)

map.addEventListener("draw:created", function (e) {
	e.layer.addTo(drawnItems);
	drawControl.remove(map);
	drawControlEditOnly.addTo(map);
    createFormPopup();
});

map.addEventListener("draw:editstart", function (e) {
	drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function (e) {
	drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function (e) {
	drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function (e) {
	if (drawnItems.getLayers().length > 0) {
		drawnItems.openPopup();
	};
	drawControlEditOnly.remove(map);
	drawControl.addTo(map);
});





// create custom icon
var firefoxIcon = L.icon({
	iconUrl: "bus.svg",
	iconSize: [20, 20], // size of the icon
});

var redIcon = L.icon({
	iconUrl: "red.svg",
	iconSize: [20, 20], // size of the icon
});

// specify popup options 
var customOptions =
{
	'maxWidth': '500',
	'className': 'custom'
}

// Add data from CARTO using the SQL API

let url1 = "https://winni.carto.com/api/v2/sql";
let urlinfo = url1 + "?q=";
let urlGeoJSON = url1 + "?format=GeoJSON&q=";
let test = 
"SELECT points.cartodb_id, points.the_geom, names.name AS stopname, route.route1, route.route2, route.route3 FROM points INNER JOIN names ON points.the_geom = names.the_geom INNER JOIN route ON points.the_geom = route.the_geom";


function fetchroutes() {
	fetch(urlGeoJSON + test)
		.then(function (response) {
			return response.json();
		})
		.then(function (data) {
			console.log(data)
			L.geoJSON(data, {
				pointToLayer: function (feature, latlng) {
					return L.marker(latlng, { icon: firefoxIcon }); 
				},
				onEachFeature: addPopup
			}).addTo(cartoData);
		})	
}

fetchroutes();


function addPopup(feature, layer) {

	class Base {

		constructor(cartodb_id) {
			this.cartodb_id = cartodb_id
		}

		id() {
			return `${this.cartodb_id}` 
		}
	}

	class First extends Base {

		constructor(cartodb_id, stopname, route1) {
			super(cartodb_id);
			this.stopname = stopname
			this.route1 = route1
		}

		first() {
			return `${this.cartodb_id} - ` + `${this.stopname}` + `<br> ${this.route1} ` 
		}
	}

	class Area extends First {

		constructor(cartodb_id, stopname, route1, route2) {
			super(cartodb_id, stopname, route1);
			this.route2 = route2
		}

		route() {
			return `${this.cartodb_id} - ` + `${this.stopname}` + `<br> ${this.route1} ` + ` <br> ${this.route2}`
		}
	}

	class All extends Area {

		constructor(cartodb_id, stopname, route1, route2, route3) {
			super(cartodb_id, stopname, route1, route2);
			this.route3 = route3
		}

		complete() {
			return `${this.cartodb_id} - ` + `${this.stopname}` + `<br> ${this.route1} ` + `<br> ${this.route2}` + `<br>${this.route3} `
		}
	}

	const all = new All(feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1, feature.properties.route2, feature.properties.route3);
	const popupContent =
			"<br><b>Contribute a route</b><br>" +
			'<form >' +
			'<br><input type="text" id="input_area" placeholder="Route" style="width: 100%;"><br>' +
			'<br><input type="text" id="input_routenumber" placeholder="#" style="width: 45%;"><input type="text" id="input_cartodb_id" placeholder="ID" required="required" style="width: 45%;"><br>' +
			'<input type="button" value="Save" style="width: 100%;" id="submitrest">' +
			'</form>'

	const popupName = 
			"<br><b>Contribute a route</b><br>" +
			'<form >' +
			'<br><input type="text" id="input_name" placeholder="Stop Name" style="width: 100%;"><br>' +
			'<br><input type="text" id="input_area" placeholder="Route" style="width: 100%;"><br>' +
			'<br><input type="text" id="input_routenumber" placeholder="#" style="width: 45%;"><input type="text" id="input_cartodb_id" placeholder="ID" required="required" style="width: 45%;"><br>' +
			'<input type="button" value="Save" style="width: 100%;" id="submitall">' +
			'</form>'

	if (feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1, feature.properties.route2, feature.properties.route3) {
		layer.bindPopup(`
		${all.complete()}<br>`
		); 
	} else if (feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1, feature.properties.route2) {
		layer.bindPopup(`
		${all.route()}<br>`
		+ popupContent
		);  
	} else if (feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1) {
		layer.bindPopup(`
		${all.first()}<br>`
		+ popupContent
		);  
	} else if (feature.properties.cartodb_id, feature.properties.stopname) {
		layer.bindPopup(`
		${all.first()}<br>`
		+ popupContent
		);
	} else if (feature.properties.cartodb_id){
		layer.bindPopup(`
		${all.route()}`
		+ popupName
		); 		
	}


};

function setData(e) {
    
	if (e.target && e.target.id == "submit" || e.target && e.target.id == "submitrest" || e.target && e.target.id == "submitall") {

		const sql = new cartodb.SQL({ user: 'winni' });
		
		const enteredArea = document.getElementById("input_area").value;
		const enteredNumber = document.getElementById("input_routenumber").value;
		
		const route = enteredArea + " Route " + enteredNumber;

		if (e.target && e.target.id == "submit") {

			drawnItems.eachLayer(function (layer) {

				const enteredStopname = document.getElementById("input_name").value;
				let drawing = JSON.stringify(layer.toGeoJSON().geometry);

				query = "SELECT * FROM stops_complete('" + drawing + "', '" + enteredStopname +"','" + route +"')"
				experi();

            	// Transfer submitted drawing to the CARTO layer
				let newData = layer.toGeoJSON();
				newData.properties.description = enteredStopname;
				newData.properties.name = enteredArea;
				newData.properties.name = enteredNumber;
				L.geoJSON(newData, {
							pointToLayer: function (feature, latlng) {
								return L.marker(latlng, { icon: firefoxIcon }); 
							},
							onEachFeature: addPopup
						}).addTo(cartoData);

				// Clear drawn items layer
			}); 

		} else if (e.target && e.target.id == "submitrest") {
			
			const enteredID = document.getElementById("input_cartodb_id").value;

			cartoData.eachLayer(function (layer) {
				
				// sql.execute("SELECT * FROM route_func('" + route + "', " + enteredID + ")");
				query = "SELECT * FROM route_func('" + route + "', " + enteredID + ")";
				experi()

			})
		} else if (e.target && e.target.id == "submitall") {

			cartoData.eachLayer(function (layer) {

				const enteredID = document.getElementById("input_cartodb_id").value;
				const enteredStopname = document.getElementById("input_name").value;
				
				query = "SELECT * FROM names_route('" + route + "', '" + enteredStopname + "', " + enteredID + ")";
				experi()
			})
		}
	}

}

function experi() {
	if (document.getElementById("input_area").value == '' || document.getElementById("input_routenumber").value == '') {
		alert("Please fill in all the fields.")
		return true;
	} else {
		if (confirm('Ready to Save?')) {
			fetch(url1, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: "q=" + encodeURI(query)
			})
				.then(response => {
					if (!response.ok) throw response;
					return response.json()
				})
				.then(function (data) {
				
					on();
					cartoData.clearLayers();

					drawnItems.closePopup()
					drawnItems.clearLayers()

					fetchroutes();
				})
				.catch(error => {
					error.json().then((body) => {
						error1 = JSON.stringify(body)
						error2 = error1.replace('{', '').replace('}', '').replace('"', '');

						alert("Error saving data: " + error2)
					});
					
				});
		}
	}
}

// Overlay

function on() {
	document.getElementById("overlay").style.display = "block";
}

function off() {
	document.getElementById("overlay").style.display = "none";
}

// Routename Pop-up
function createFormPopup() {
	let popupContent =
		'<form >' +
		'<br><input type="text" id="input_name" placeholder="Stop Name" style="width: 120px;"><br>' +
		'<br><input type="text" id="input_area" placeholder="Route" style="width: 100%;"><br>' +
		'<br><input type="text" id="input_routenumber" placeholder="#" style="width: 100%;">' +
		'<input type="button" value="Save" style="width: 100%;" id="submit">' +
		'</form>'
	drawnItems.bindPopup(popupContent).openPopup();
}

// Search 

function searchRoutes(data) {
	
    map.removeLayer(cartoData);

	L.geoJSON(data, {
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, { icon: redIcon }, 
			map.flyTo(latlng, 14, {
				animate: true,
				duration: 1 // in seconds                                                
			}));
    },
		onEachFeature: addPopup
		
	}).addTo(tempjson);
}

// Search

let tempjson = L.layerGroup().addTo(map);

let search_function = (function() {
	let text = $('#text_').val();
	let number = $('#number_').val();
	let searchitem = text + " Route " + number;

	let sql = 
	"SELECT points.cartodb_id, route.the_geom, route.route1, route.route2, route.route3, names.name AS stopname FROM points INNER JOIN route ON route.the_geom = points.the_geom INNER JOIN names ON points.the_geom = names.the_geom WHERE route1 ilike '" + searchitem + "' OR route2 ilike '" + searchitem + "' OR route3 ilike '" + searchitem + "'";
	let sqltext = "SELECT points.cartodb_id, route.the_geom, route.route1, route.route2, route.route3, names.name AS stopname FROM points INNER JOIN route ON route.the_geom = points.the_geom INNER JOIN names ON points.the_geom = names.the_geom WHERE CONCAT(route1, '', route2, '', route3) ILIKE '%" + text + "%'";

	if (text && number) {
		if (true) {
			
			tempjson.clearLayers();

			fetch(urlGeoJSON, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: "q=" + encodeURI(sql)
			})

				// make it uncheck the stops box, to remove the other stops when looking for the queries ones
				.then((response) => response.json())

				.then(function (data) {
					searchRoutes(data)
				}) 
			return false
		}                  
	} else if (text) {
		if (true) {
			
			tempjson.clearLayers();

			fetch(urlGeoJSON, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: "q=" + encodeURI(sqltext)
			})

				.then((response) => response.json())

				.then(function (data) {
					searchRoutes(data)
				}) 
			return false
		}
	} else if (text == "") {
		return false

	}
})

document.addEventListener("click", setData)
