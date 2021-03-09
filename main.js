/* Leafletdraw to 1 database and back */

// initialize Leaflet

let map = L.map('map').setView({lon: 25.9249, lat: -24.64443}, 14); 
L.tileLayer('https://api.mapbox.com/styles/v1/winniatthepark/ckk518ast0a7o17paz5r7bros/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoid2lubmlhdHRoZXBhcmsiLCJhIjoiY2tocWxwYjB3MGFkeTJxcGJ6cDZzd285NCJ9.gZ7tGDVxt_ArW9WptTgK8A', {
    maxZoom: 19,
	attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors </a> ',
	accessToken: 'pk.eyJ1Ijoid2lubmlhdHRoZXBhcmsiLCJhIjoiY2tocWxwYjB3MGFkeTJxcGJ6cDZzd285NCJ9.gZ7tGDVxt_ArW9WptTgK8A',
	snappable: true,
}).addTo(map);

let drawnItems = L.featureGroup().addTo(map);
let cartoData = L.layerGroup().addTo(map);
let polygonLayer = L.featureGroup().addTo(map);

// add leaflet.pm controls to the map

map.pm.addControls({
	edit: {
		featureGroup: polygonLayer, 
	}
});

polygonLayer.pm.enable(
	options = {
		position: 'topright',
		drawRectangle: false, // adds button to draw a rectangle
		drawPolygon: false, // adds button to draw a polygon
		drawCircle: false, 
		drawMarker: false, 
		editPolygon: false
	}
);

// add leaflet.pm controls to the map
map.pm.addControls(options);

// listen to vertexes being added to the workingLayer (works only on polylines & polygons)
map.on('pm:drawstart', function(e) {
  const layer = e.workingLayer;

  layer.on('pm:vertexadded', function(e) {
    // e includes the new vertex, it's marker
    // the index in the coordinates array
    // the working layer and shape
  });

	map.on('pm:drawend', function(e) {
    	layer.addTo(polygonLayer)
		createFormPopup();

	});

});

/*
var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
};

var url = 'copyroad.geojson'; 
 //var bbTeam = L.geoJSON(null, {onEachFeature: forEachFeature, style: style});
var bbTeam = L.geoJSON(null, {
	style: myStyle
});

// Get GeoJSON data and create features.
$.getJSON(url, function(data) {
    bbTeam.addData(data);
});

bbTeam.addTo(map);

var topology = bbTeam.topology({bbTeam: geojson});

*/

// Add data from CARTO using the SQL API
let url1 = "https://winni.carto.com/api/v2/sql";
let urlGeoJSON = url1 + "?format=GeoJSON&q=";
const sqlQuery = "SELECT cartodb_id, the_geom, name, area, route_number FROM stops";

function addPopup(feature, layer) {
	if (feature.properties.name, feature.properties.area, feature.properties.route_number) {

		layer.bindPopup(feature.properties.cartodb_id+" - "+feature.properties.name + 
		"<br>" + feature.properties.area + 
		"<br>Route " + feature.properties.route_number) 

	} else if (feature.properties.name) {
		let popupContent = 
        '<form>' + 
        'Route:<br><input type="text" id="input_area" required="required"><br>' +
		'#:<br><input type="text" id="input_routenumber" required="required"><br>' +
		'Nickname:<br><input type="text" id="input_nick" required="required"><br>' +
		'ID:<br><input type="text" id="input_cartodb_id" required="required"><br>' +
        '<input type="button" value="Submit" id="submitrest">' +
        '</form>';

		layer.bindPopup(feature.properties.cartodb_id+" - "+feature.properties.name + popupContent )
	} else {
		layer.bindPopup(feature.properties.cartodb_id +
			'<form>' + 
			'Name:<br><input type="text" id="input_name"><br>' +
			'Route:<br><input type="text" id="input_area"><br>' +
			'#<br><input type="text" id="input_routenumber"><br>' +
			'Nickname:<br><input type="text" id="input_nick"><br>' +
			'ID:<br><input type="text" id="input_cartodb_id" required="required"><br>' +
			'<input type="button" value="submit" id="submitall">' + 
			'</form>'
		)
	}
}

fetch(urlGeoJSON + sqlQuery)
	.then(function(response) {
		return response.json();
	})
	.then(function(data) {
		L.geoJSON(data, {onEachFeature: addPopup}).addTo(cartoData);
	});

// Routename Pop-up
function createFormPopup() {
    let popupContent = 
        '<form name="myForm" onsubmit="return validateForm()" method="post">' + 
		'Name:<br><input type="text" id="input_name" required="required"><br>' +
        'Route:<br><input type="text" id="input_area" required><br>' +
		'#:<br><input type="text" id="input_routenumber"><br>' +
		'Nickname:<br><input type="text" id="input_nick"><br>' +
        '<input type="button" value="Submit" id="submit">' + 
        '</form>';
    polygonLayer.bindPopup(popupContent).openPopup();
}

// Sending data to CARTO
function setData(e) {
	
    if(e.target && e.target.id == "submit") {
		const enteredArea = document.getElementById("input_area").value;
		const enteredNumber = document.getElementById("input_routenumber").value;
		const enteredNickname = document.getElementById("input_nick").value;
		const enteredStopname = document.getElementById("input_name").value;

		// For each drawn layer
		polygonLayer.eachLayer(function(layer) {

			// SQL to put layer in -- Building the SQL query
			let drawing = JSON.stringify(layer.toGeoJSON().geometry);
			let sql =
				"INSERT INTO stops (the_geom, area, route_number, name, nickname) " +
				"VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
				drawing + "'), 4326), '" +
				enteredArea + "', '" +
				enteredNumber + "', '" +
				enteredStopname + "', '" +
				enteredNickname + "')";
			console.log(sql);

			if (enteredArea && enteredNickname && enteredNumber && enteredStopname) {
				// Sending the SQL query to CARTO
				fetch(url1, {
					method: "POST", 
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					}, 
					body: "q=" + encodeURI(sql)
				})
					.then(function(response) {
						return response.json();
					})
					.then(function(data) {
						console.log("Data saved:", data);
					})
					.catch(function(error) {
						console.log("Problem saving the data:", error);
					});				
			} else {
				alert("Please fill in all the fields");
			}


			// Transfer submitted data draw to the CARTO layer
			let newData = layer.toGeoJSON();
			newData.properties.area = enteredArea;
			newData.properties.routenumber = enteredNumber;
			newData.properties.name = enteredStopname;
			newData.properties.nick = enteredNickname;
			L.geoJSON(newData, {onEachFeature: addPopup}).addTo(cartoData);
		
		});

		// Clear drawn items layer
		polygonLayer.closePopup();
		polygonLayer.clearLayers();

	} else if(e.target && e.target.id == "submitrest") {

		const enteredArea = document.getElementById("input_area").value;
		const enteredNumber = document.getElementById("input_routenumber").value;
		const enteredNickname = document.getElementById("input_nick").value;
	    const enteredID = document.getElementById("input_cartodb_id").value;
	
		// For the already existing carto layer
		cartoData.eachLayer(function(layer) {

			// SQL to put layer in -- Building the SQL query
			let sql =
				"UPDATE stops " +
				"SET area = '" + enteredArea + "', " +
				"route_number = '" + enteredNumber + "', " +
				"nickname = '" + enteredNickname + "' " +
				"WHERE cartodb_id = " + enteredID + ";"
			console.log(sql);

			if (enteredArea && enteredNickname && enteredNumber && enteredID) {
				// Sending the SQL query to CARTO
				fetch(url1, {
					method: "POST", 
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					}, 
					body: "q=" + encodeURI(sql)
				})
					.then(function(response) {
						return response.json();
					})
					.then(function(data) {
						console.log("Data saved:", data);
					})
					.catch(function(error) {
						console.log("Problem saving the data:", error);
					});				
			} else {
				alert("Please fill all the fields");
			}
		});

		// Clear drawn items layer
		drawnItems.closePopup();
		drawnItems.clearLayers();

	} else if(e.target && e.target.id == "submitall") {
		
		const enteredStopname = document.getElementById("input_name").value;
		const enteredArea = document.getElementById("input_area").value;
		const enteredNumber = document.getElementById("input_routenumber").value;
		const enteredNickname = document.getElementById("input_nick").value;
	    const enteredID = document.getElementById("input_cartodb_id").value;
	
		// For the already existing carto layer
		cartoData.eachLayer(function(layer) {

			// SQL to put layer in -- Building the SQL query
			let sql =
				"UPDATE stops " +
				"SET name = '" + enteredStopname + "', " +				
				"area = '" + enteredArea + "', " +
				"route_number = '" + enteredNumber + "', " +
				"nickname = '" + enteredNickname + "' " +
				"WHERE cartodb_id = " + enteredID + ";"
			console.log(sql);

			if (enteredArea && enteredNickname && enteredNumber && enteredStopname && enteredID) {
				// Sending the SQL query to CARTO
				fetch(url1, {
					method: "POST", 
					headers: {
						"Content-Type": "application/x-www-form-urlencoded"
					}, 
					body: "q=" + encodeURI(sql)
				})
					.then(function(response) {
						return response.json();
					})
					.then(function(data) {
						console.log("Data saved:", data);
					})
					.catch(function(error) {
						console.log("Problem saving the data:", error);
					});				
			} else {
				alert("Please fill all the fields");
			}

		
		});

		// Clear drawn items layer
		cartoData.closePopup();
	}
}

document.addEventListener("click", setData)