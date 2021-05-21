Icons =  '<a href="fontawesome.com">FA</a>';

let transport = L.tileLayer('https://api.mapbox.com/styles/v1/winniatthepark/ckk518ast0a7o17paz5r7bros/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoid2lubmlhdHRoZXBhcmsiLCJhIjoiY2tocWxwYjB3MGFkeTJxcGJ6cDZzd285NCJ9.gZ7tGDVxt_ArW9WptTgK8A', {
	attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors </a> '+ ', ' + Icons, 
});

let satellite = L.tileLayer('https://api.mapbox.com/styles/v1/winniatthepark/cko6xh5093lry17qb4k5ks8px/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoid2lubmlhdHRoZXBhcmsiLCJhIjoiY2tocWxwYjB3MGFkeTJxcGJ6cDZzd285NCJ9.gZ7tGDVxt_ArW9WptTgK8A', {
	attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors </a> '+ ', ' + Icons, 
});
let map = L.map('map', {
	center: [-24.625180, 25.927364],
	zoom: 15,
	maxZoom: 28,
	layers: [transport],
});

// Map panes for toggling route layers

var carto_pane = map.createPane('cpane');
map.getPane('cpane').style.zIndex = 550;
map.getPane('cpane').style.pointerEvents = 'none'; 

var result_pane = map.createPane('rpane');
map.getPane('rpane').style.zIndex = 650;
map.getPane('rpane').style.pointerEvents = 'none'; 

// Map layers

let baseMaps = {
	"Roads": transport,
	"Satellite": satellite
};

let cartoData = L.layerGroup().addTo(map);

let overlayMaps = {
	"Stops": cartoData,
}

L.control.layers(baseMaps, overlayMaps, {
	collapsed: false
}).addTo(map);

// Location

function onLocationFound(e) {
	var radius = e.accuracy;
}

map.on('locationfound', onLocationFound);

function onLocationError(e) {
	console.log(e.message);
}

map.on('locationerror', onLocationError);

var find = L.easyButton({
	id: "locationbtn",
	leafletClasses: true, 
	position: 'topright',
	states: [{
		title: 'find my location',
		icon: 'icons/flag-solid.svg', 
		onClick: function(){
			map.locate({
				setView: true,
				maxZoom: 16,
				enableHighAccuracy: true
			});
		}
	}]
}).addTo(map);

// Draw

let drawnItems = L.featureGroup().addTo(map);
map.addLayer(drawnItems)

L.drawLocal.draw.toolbar.buttons.marker = 'place a stop';
L.drawLocal.draw.handlers.marker.tooltip.start = 'to see stops on the ground clearly <br> 1. switch to the satellite map <br> in the top-right corner, <br> 2. zoom in ';

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

var drawControlEditOnly = new L.Control.Draw({
	edit: {
		featureGroup: drawnItems
	},
	draw: false
});

map.addControl(drawControl)



map.addEventListener("draw:created", function (e, latlng) {
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

// Flag button to report route

var flag = L.easyButton({
	id: "flagbtn",
	leafletClasses: true,  
	states: [{
		title: 'flag a route as incorrect',
		icon: 'icons/flag-solid.svg', 
		onClick: function(){
			toggle_flag()
		}
	}]
}).addTo(map);

// Flag form to report route

function toggle_flag() {
	var e = document.getElementById('feedback-main');
	toggle(e)
}

function send() {
	const enteredArea = document.getElementById("input_area").value;
	const enteredNumber = document.getElementById("input_routenumber").value;
	const enteredID = document.getElementById("input_cartodb_id").value;
			
	const route = enteredArea + " Route " + enteredNumber

	query = "SELECT * FROM errors('" + route + "', " + enteredID + ")";
	send_query();

	document.getElementById("feedback-div").style.display = "none";

}

// Busstop Icons

var stopicon = L.icon({
	iconUrl: "./icons/bus.png",
	iconSize: [15, 30], 
	iconAnchor: [10, 25],
});

var resulticon = L.icon({
	iconUrl: "./icons/bluebus.png",
	iconSize: [15, 30], 
	iconAnchor: [10, 25],
});

// Add data from CARTO using the SQL API

let url1 = "https://winni.carto.com/api/v2/sql";
let urlinfo = url1 + "?q=";
let urlGeoJSON = url1 + "?format=GeoJSON&q=";
let cartoquery = 
"SELECT points.cartodb_id, points.the_geom, names.name AS stopname, route.route1, route.route2, route.route3 FROM points INNER JOIN names ON points.the_geom = names.the_geom INNER JOIN route ON points.the_geom = route.the_geom";

function fetchroutes() {
	fetch(urlGeoJSON + cartoquery)
		.then(function (response) {
			return response.json();
		})
		.then(function (data) {		
			L.geoJson(data, {
				
				pointToLayer: function (feature, latlng) {				
					return new L.marker(latlng, { 
						icon: stopicon,
						pane: 'cpane'
					}); 
				},
				onEachFeature: addPopup 
				
			}).addTo(cartoData);
			
		})	
}

fetchroutes()

const popupContent =
	'<form>' +
	'<br><input type="text" id="input_area" placeholder="Route" style="width: 80%;"><input type="button" onclick="return toggle_mass()" title="add route to multiple stops" class="btn_plus" style="width: 12%;" id="morearea">'+
	'<br><input type="text" id="input_routenumber" placeholder="#" style="width: 35%;"><input type="text" id="input_cartodb_id" placeholder="ID (top-left)" required="required" style="width: 55%;"><br>' +
	'<input type="button" value="Save" style="width: 100%;" id="submitrest">' +
	'</form>'

const popupName = 
	"<br><b>Contribute a route</b><br>" +
	'<form >' +
	'<br><input type="text" id="input_name" placeholder="Stop Name" style="width: 100%;"><input type="button" onclick="return toggle_mass()" title="add route to multiple stops" class="btn_plus" style="width: 12%;" id="morearea">' +
	'<br><input type="text" id="input_area" placeholder="Route" style="width: 100%;"><br>' +
	'<br><input type="text" id="input_routenumber" placeholder="#" style="width: 35%;"><input type="text" id="input_cartodb_id" placeholder="ID (top-left)" required="required" style="width: 55%;"><br>' +
	'<input type="button" value="Save" style="width: 100%;" id="submitall">' +
	'</form>'

// Carto Data in popup

function addPopup(feature, layer) {

	class Base {

		constructor(cartodb_id) {
			this.cartodb_id = cartodb_id
		}

		id() {
			return `${this.cartodb_id}` 
		}
	}

	class All extends Base {

		constructor(cartodb_id, stopname, route1, route2, route3) {
			super(cartodb_id);
			this.stopname = stopname
			this.route1 = route1
			this.route2 = route2
			this.route3 = route3
		}
	

		complete() {
			return `${this.cartodb_id} - ` + `${this.stopname}` + `<br> ${this.route1} ` + `<br> ${this.route2}` + `<br>${this.route3}`
		}
	}

	const all = new All(feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1, feature.properties.route2, feature.properties.route3);

	if (feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1, feature.properties.route2, feature.properties.route3) {
		layer.bindPopup(`
		${all.complete()}<br>`
		); 
	} else if (feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1, feature.properties.route2) {
		layer.bindPopup(`
		${all.complete()}<br>`
		+ popupContent
		); 
	} else if (feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1) {
		layer.bindPopup(`
		${all.complete()}<br>`
		+ popupContent
		); 
	} else if (feature.properties.cartodb_id) {
		layer.bindPopup(`
		${all.complete()}<br>`
		+ popupName
		); 		
	} 
};

// Sending data to Carto

function setData(e) {
    
	if (e.target && e.target.id == "submit" || e.target && e.target.id == "submitrest" || e.target && e.target.id == "submitall")  {

		const enteredArea = document.getElementById("input_area").value;
		const enteredNumber = document.getElementById("input_routenumber").value;
		
		const route = enteredArea + " Route " + enteredNumber;

		if (e.target && e.target.id == "submit") {

			drawnItems.eachLayer(function (layer) {

				const enteredStopname = document.getElementById("input_name").value;
				let drawing = JSON.stringify(layer.toGeoJSON().geometry);

				query = "SELECT * FROM stops_complete('" + drawing + "', '" + enteredStopname +"','" + route +"')"
				send_query();

            	// Transfer submitted drawing to the CARTO layer
				let newData = layer.toGeoJSON();
				newData.properties.description = enteredStopname;
				newData.properties.name = enteredArea;
				newData.properties.name = enteredNumber;
				L.geoJSON(newData, {
							pointToLayer: function (feature, latlng) {
								return L.marker(latlng, { icon: stopicon }); 
							},
							onEachFeature: addPopup
						}).addTo(cartoData);

			}); 

		} else if (e.target && e.target.id == "submitrest") {
			
			const enteredID = document.getElementById("input_cartodb_id").value;

			cartoData.eachLayer(function (layer) {
				
				query = "SELECT * FROM route_func('" + route + "', " + enteredID + ")";
				send_query()

			})
		} else if (e.target && e.target.id == "submitall") {

			cartoData.eachLayer(function (layer) {

				const enteredID = document.getElementById("input_cartodb_id").value;
				const enteredStopname = document.getElementById("input_name").value;
				
				query = "SELECT * FROM names_route('" + route + "', '" + enteredStopname + "', " + enteredID + ")";
				send_query()
			})
		} 
	}
}

function mass_query() {
	
	const enteredArea = document.getElementById("mass_area").value;
	const enteredNumber = document.getElementById("mass_routenumber").value;
	
	const route = enteredArea + " Route " + enteredNumber;

	const id1 = document.getElementById("input_cartodb_id1").value;
	const id2 = document.getElementById("input_cartodb_id2").value; 
var foo = "test";
	if ("input_cartodb_id3" > 0) {
		let id3 = document.getElementById("input_cartodb_id3").value;

		console.log(foo); // Interviewer: "What does this alert?" Answer: "test"
		var foo = "bar";

	} 
	console.log(foo); //
	const id4 = document.getElementById("input_cartodb_id4").value;
	const id5 = document.getElementById("input_cartodb_id5").value;

	query = "SELECT * FROM mass_func('" + route + "', " + id1 + id2 + id3 + id4 + id5 + ")";
	to_carto()
	toggle_mass()

	// haven't checked what happens if user doesn't put in five IDs
}

function to_carto() {
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
			.catch((error) => {
				if (error.json) {
					error.json().then((body) => {
						error1 = JSON.stringify(body)
						error2 = error1.replace('{', '').replace('}', '').replace('"', '');

						alert("Error saving data: " + error2);
					});						
				} else {
					alert("Error saving data");
					
				}
				
				return false;
			})
			
	} 
	return false;	
}

function send_query() {
	// Why isn't it reading mass_query's inputs?
	if (document.getElementById("input_area").value == '' || document.getElementById("input_routenumber").value == '' ) {
		alert("Please fill in all the .")
		return true;
	} else {
		to_carto()
	} 
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
	drawnItems.bindPopup(popupContent, {keepInView: true}).openPopup();
}

// Search Bar / Index

var resultjson = L.layerGroup().addTo(map);

function searchRoutes(data) {

	carto_pane.style.display = 'none'

	L.geoJSON(data, {
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, { icon: resulticon, pane: 'rpane'}, 
			map.flyTo(latlng, 14, {
				animate: true,
				duration: 1                                               
			}));
    },
		onEachFeature: addPopup
		
	}).addTo(resultjson);

	setTimeout(function() { carto_pane.style.display = 'block'; }, 30000);
}

function returned_data(data) {

	lele = JSON.stringify(data)
	
	if (lele.length > 50) {
		searchRoutes(data)
	} else {
		
		document.getElementById("results-main").style.display = "block";
		setTimeout(function () { $('#results-main').fadeOut('fast'); }, 6000);	
	}
}

var search_function = (function() {

	var searchselect = $('#search-select').val();
	var searchtype = $('#text_').val();

	if (searchtype !== "") {
		var text = searchtype
		console.log(text)
	} else {
		var text = searchselect
	}

	var number = $('#search-number').val();
	var searchitem = text + " Route " + number;

	var sql = 
	"SELECT points.cartodb_id, route.the_geom, route.route1, route.route2, route.route3, names.name AS stopname FROM points INNER JOIN route ON route.the_geom = points.the_geom INNER JOIN names ON points.the_geom = names.the_geom WHERE route1 ilike '" + searchitem + "' OR route2 ilike '" + searchitem + "' OR route3 ilike '" + searchitem + "'";
	var sqltext = "SELECT points.cartodb_id, route.the_geom, route.route1, route.route2, route.route3, names.name AS stopname FROM points INNER JOIN route ON route.the_geom = points.the_geom INNER JOIN names ON points.the_geom = names.the_geom WHERE CONCAT(route1, '', route2, '', route3) ILIKE '%" + text + "%'";

	if (text && number) {
		if (true) {
			
			resultjson.clearLayers();

			fetch(urlGeoJSON, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: "q=" + encodeURI(sql)
			})
				.then((response) => response.json())

				.then(function (data) {
					returned_data(data)
				})

			return false
		}                  
	} else if (text) {
		if (true) {
			
			resultjson.clearLayers();

			fetch(urlGeoJSON, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: "q=" + encodeURI(sqltext)
			})
				.then((response) => response.json())

				.then(function (data) {
					returned_data(data)
				}) 
			return false
		}
	} else if (text == "") {
		return false

	}
})


document.addEventListener("click", setData)

// Responses

function on() {
	document.getElementById("success-main").style.display = "block";
	setTimeout(function () { $('#success-main').fadeOut('fast'); }, 4000);	
}

document.getElementById("success-main").style.display = "none";
document.getElementById("form-div").style.display = "none";

// Show HTML Forms

function toggle(e) {
	if(e.style.display == 'block')
		e.style.display = 'none';
	else
		e.style.display = 'block';	
}

function toggle_netlify() {
	var e = document.getElementById('form-div');
	toggle(e)
}

function toggle_mass() {
	var e = document.getElementById('mass-send');
	toggle(e)
}

function search_bar() {
	document.getElementById("search-select").style.display = "none";
	document.getElementById("search-type").style.display = "block";
}