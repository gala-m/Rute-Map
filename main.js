var mapDiv = document.getElementById("map");
var overlayDiv = document.getElementById("bar");
mapDiv.appendChild(overlayDiv);

Icons =  '<a href="fontawesome.com">FA</a>';

let transport = L.tileLayer('https://api.mapbox.com/styles/v1/winniatthepark/ckq3icq7j4fw817n6fbu5uq73/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoid2lubmlhdHRoZXBhcmsiLCJhIjoiY2tocWxwYjB3MGFkeTJxcGJ6cDZzd285NCJ9.gZ7tGDVxt_ArW9WptTgK8A', {
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
	zoomControl: false
});

// Map panes for toggling route layers

var carto_pane = map.createPane('cpane');
map.getPane('cpane').style.zIndex = 550;
map.getPane('cpane').style.pointerEvents = 'none'; 

var link_pane = map.createPane('lpane');
map.getPane('lpane').style.zIndex = 550;
map.getPane('lpane').style.pointerEvents = 'none'; 

var result_pane = map.createPane('rpane');
map.getPane('rpane').style.zIndex = 650;
map.getPane('rpane').style.pointerEvents = 'none'; 

// Map layers

let baseMaps = {
	"Roads": transport,
	"Satellite": satellite
};

let cartoData = L.layerGroup().addTo(map);
let zoomData = L.layerGroup().addTo(map);

let overlayMaps = {
	"Stops": cartoData
}

L.control.layers(baseMaps, overlayMaps, {
	collapsed: false
}).addTo(map);

if (L.Browser.mobile) {
   $('#bar').remove();
}

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

new L.Control.Zoom({ position: 'bottomright' }).addTo(map);

// Draw

let drawnItems = L.featureGroup().addTo(map);
map.addLayer(drawnItems)

L.drawLocal.draw.toolbar.buttons.marker = 'place a stop';
L.drawLocal.draw.handlers.marker.tooltip.start = 'to see stops on the ground clearly <br> 1. switch to the satellite map <br> in the top-right corner, <br> 2. zoom in ';

drawControl = new L.Control.Draw({
	position: 'topright',
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
});

// Flag button to report route

var flag = L.easyButton({
	id: "flagbtn",
	leafletClasses: true,  
	position: 'topright',
	states: [{
		title: 'flag a route as incorrect',
		icon: 'icons/flag-solid.svg', 
		onClick: function(){
			toggle_flag()
		}
	}]
}).addTo(map);

var mail = L.easyButton({
	id: "mailbtn",
	leafletClasses: true,  
	position: 'topright',
	states: [{
		title: 'get in touch',
		icon: 'icons/envelope-solid.svg', 
		onClick: function(){
			toggle_netlify()
		}
	}]
}).addTo(map);

// Flag form to report route

function toggle_flag() {
	var e = document.getElementById('feedback-main');
	toggle(e)
}

// Busstop Icons

var stopicon = L.icon({
	iconUrl: "icons/bus.png",
	iconSize: [15, 15], 
	className: 'stopicon'
	// iconAnchor: [10, 25],
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
					console.log('lpane')			
					return L.circleMarker(latlng, { 
						radius: 1.5,
						weight: 1, 
						color: '#081f40',
						pane: 'lpane',
						
					})
				},	
				onEachFeature: addPopup,

			}).addTo(cartoData);
			
			link_pane.style.display = 'none';

			L.geoJson(data, {

				pointToLayer: function (feature, latlng) {	
					console.log('cpane')				
					return L.marker(latlng, { 
						icon: stopicon,
						pane: 'cpane'
					})
				},
				
				onEachFeature: addPopup 
				
			}).addTo(cartoData);
			
		})	
}

fetchroutes()

function clickZoom(e) {
    map.setView(e.target.getLatLng());
}

map.on('zoomend', function(e) {
	
	var currentZoom = map.getZoom();
	
    if (currentZoom > 15 ) {	
		link_pane.style.display = 'none'
        carto_pane.style.display = 'block' 

		resultjson.eachLayer(function (layer) {  
			layer.setStyle({radius: 8 }) 
		});
	
	} else if (currentZoom < 15 ) {
		carto_pane.style.display = 'none'
		link_pane.style.display = 'block'	

		resultjson.eachLayer(function (layer) {  
			layer.setStyle({radius: 2.5 }) 
		});	 
    }
})

const popupContent =
	'<form>' +
	'<br><input type="text" id="input_area" placeholder="Route" style="width: 75%;"><input type="text" id="input_routenumber" placeholder="#" style="width: 20%; position: relative; right: -5px;"><br>' +
	'<br><input type="text" id="input_cartodb_id" placeholder="ID (top-left)" required="required" style="width: 75%;"><input type="button" onclick="return toggle_mass()" title="add route to multiple stops?" class="btn_plus" style="width: 12%;" id="morearea">' +
	'<input type="button" value="Save" style="width: 100%;" id="submitrest">' +
	'</form>'

const popupName = 
	'<form>' +
	'<br><input type="text" id="input_name" placeholder="Stop Name" style="width: 100%;"><br>' +
	'<br><input type="text" id="input_area" placeholder="Route" style="width: 75%;"><input type="text" id="input_routenumber" placeholder="#" style="width: 20%; position: relative; right: -5px;"><br>' +
	'<br><input type="text" id="input_cartodb_id" placeholder="ID (top-left)" required="required" style="width: 75%;"><input type="button" onclick="return toggle_mass()" title="add route to multiple stops?" class="btn_plus" style="width: 12%;" id="morearea">' +
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
		).on('click', clickZoom); 
	} else if (feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1, feature.properties.route2) {
		layer.bindPopup(`
		${all.complete()}<br>`
		+ popupContent
		).on('click', clickZoom); 
	} else if (feature.properties.cartodb_id, feature.properties.stopname, feature.properties.route1) {
		layer.bindPopup(`
		${all.complete()}<br>`
		+ popupContent
		).on('click', clickZoom); 
	} else if (feature.properties.cartodb_id) {
		layer.bindPopup(`
		${all.complete()}<br>`
		+ popupName
		).on('click', clickZoom); 		
	} 
};

var today = new Date();
var year = today.getFullYear();
var month = today.getMonth(); 
var date = today.getDate();
var hours = today.getHours()
var submission_date = year + "-" + month + "-" + date + "-" + hours

// Sending data to Carto

function setData(e) {
    
	if (e.target && e.target.id == "submit" || e.target && e.target.id == "submitrest" || e.target && e.target.id == "submitall")  {

		if (confirm('Ready to Save?')) { 

			const enteredArea = document.getElementById("input_area").value;
			const enteredNumber = document.getElementById("input_routenumber").value;
			
			const route = enteredArea + " Route " + enteredNumber;

			switch(e.target && e.target.id) {
				case "submit" :
					drawnItems.eachLayer(function (layer) {

						const enteredStopname = document.getElementById("input_name").value;
						let drawing = JSON.stringify(layer.toGeoJSON().geometry);

						query = "SELECT * FROM stops_complete('" + drawing + "', '" + enteredStopname +"','" + route +  "', '" + submission_date + "')"
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
					break;
				case "submitrest" :
					
					const enteredID = document.getElementById("input_cartodb_id").value;

					cartoData.eachLayer(function (layer) {
						
						query = "SELECT * FROM route_func('" + route + "', " + enteredID + ", '" + submission_date + "')";
						send_query()

					})
					break;
				case "submitall" :

					cartoData.eachLayer(function (layer) {

						const enteredID = document.getElementById("input_cartodb_id").value;
						const enteredStopname = document.getElementById("input_name").value;
						
						query = "SELECT * FROM names_route('" + route + "', '" + enteredStopname + "', " + enteredID +  ", '" + submission_date + "')";
						send_query()
					})
					break;
			} 

		}
	}
}

function mass_query() {

	if (confirm('Ready to Save?')) {	
		const enteredArea = document.getElementById("mass_area").value;
		const enteredNumber = document.getElementById("mass_routenumber").value;
		const route = enteredArea + " Route " + enteredNumber;

		var e = document.getElementById("for-counter");
		var inputs = e.getElementsByTagName("input");

		for (var i = 0; i < inputs.length;   i ++) {

			if ( inputs[i].value!== '') {
				query = "SELECT * FROM route_func('" + route + "', " +  inputs[i].value +  ", '" + submission_date + "')";
				console.log(query)			
			}
			to_carto()

		}
		toggle_mass()				
	}	

}

function to_carto() {
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
			alert("Your contribution can't be saved right now.");
		})
}

$(".feedback-input").keyup(function () {
    if (this.value.length == this.maxLength) {
      $(this).next('.feedback-input').focus();
    }
})

function send_query() {
	if (document.getElementById("input_area").value == '' || document.getElementById("input_routenumber").value == '' ) {
		alert("Please fill in all the fields.")
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
	link_pane.style.display = 'none'

	L.geoJSON(data, {
		pointToLayer: function (feature, latlng) {
			return L.circleMarker(latlng, { 
				radius: 3,
				weight: 1, 
				fillOpacity: 1,
				// fillColor: 'white',
				color: '#081f40',
				pane: 'rpane',
				className: 'shadow'
			}, 
			map.flyTo(latlng, 14, {
				animate: true,
				duration: 1                                               
			}))		
    },
		onEachFeature: addPopup
		
	}).addTo(resultjson);
	
	map.removeLayer(cartoData)
	
	setTimeout(function() { 

		cartoData.eachLayer(function (layer) {  
			layer.setStyle({color: '#b9722d' }) 
		});

		map.addLayer(cartoData)

	}, 20000); 

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

function toggle_error() {
	var e = document.getElementById('feedback-main');
	toggle(e)
}

$('select').on('change', function() {
    var selected = this.value;
	if (selected === "searchdata") {
		document.getElementById("search-select").style.display = "none";
		document.getElementById("search-type").style.display = "block";
	}
});

function search_bar() {
	document.getElementById("text_").value = '';
	document.getElementById("search-type").style.display = "none";
	document.getElementById("search-select").style.display = "block";
	
}