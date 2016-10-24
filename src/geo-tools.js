var https = require('https');
var http = require('http');

var url = require('url');

var Logix360GeoTools = {

	requestLACGoogle: function(countrycode, operatorid, lac, cellid, onComplete) {
		lac = parseInt(lac,16);
		cellid = parseInt(cellid,16);

	  var options, req, request;
	  options = {
	    hostname: "www.google.com",
	    port: 80,
	    method: "POST",
	    path: "/glm/mmap"
	  };
	  req = http.request(options, function(res) {
	    var response;
	    res.setEncoding('hex');
	    response = '';
	    res.on('data', function(chunk) {

	      return response += chunk;
	    });
	    return res.on('end', function() {
	      var err;
				console.log(response.length);

	      try {
	        if (response.length < 30) {
	          return onComplete(new Error(E_NOTFOUND), null);
	        } else {
	          return onComplete({
	            lat: (~~parseInt(response.slice(14, 22), 16)) / 1000000,
	            lon: (~~parseInt(response.slice(22, 30), 16)) / 1000000
	          });
	        }
	      } catch (_error) {
	        err = _error;
	        return onComplete(new Error(E_REQERROR), null);
	      }
	    });
	  });
	  request = '000e00000000000000000000000000001b0000000000000000000000030000';
	  request += ('00000000' + Number(cellid).toString(16)).substr(-8);
	  request += ('00000000' + Number(lac).toString(16)).substr(-8);
	  request += ('00000000' + Number(operatorid).toString(16)).substr(-8);
	  request += ('00000000' + Number(countrycode).toString(16)).substr(-8);
	  request += 'ffffffff00000000';
	  req.on('error', function(err) {
	    return onComplete(new Error(E_REQERROR), null);
	  });
	  return req.end(new Buffer(request, 'hex'));
	},

	requestLACOpenCellId: function(myOptions,mcc,mnc,lac, cellId, callback){
		if(myOptions.openCellIdAPIKey){
			var query = '?key='+myOptions.openCellIdAPIKey+'&mcc='+mcc+'&mnc='+mnc+'&cellid='+parseInt(cellId,16)+'&lac='+parseInt(lac,16)+'&format=json',
					options = {
						host : 'opencellid.org',
						path: '/cell/get' + query
					};
			var req = http.get(options, function(res) {
				console.log('Response: ' + res.statusCode);
				var results = '';
				res.on('error', function(e) {
					console.log('Got error: ' + e.message);

				});

				res.on('data', function(data) {
					results += data;
				});
				res.on('end', function() {
					var body = JSON.parse(results);
					if (body.error_message) {
						console.log(body.error_message);
						return;
					}
					var location = Logix360GeoTools.parseLACOpenCellId(body)
					if (callback) {
						callback(location);
					} else {
						return location;
					};
				});
			});
		}else{
			callback("OpencellId API Not Found");
		}
	},

	parseLACOpenCellId: function(data){
		var location = {lat:data.lat,lng:data.lon,mcc:data.mcc,mnc:data.mnc,lac:data.lac,cellId:data.cellid,range:data.range}
		return location;
	},

	requestReverseGeo: function(myOptions,lat,lng,callback) {
		if (lat.lat && lat.lng) {
			callback = lng
			lng = lat.lng
			lat = lat.lat
		};
		var probability;
		var providers = [];
		if(myOptions.probability){
			 probability = myOptions.probability;
		}else{
			probability = [10,2,1,1,1,1];
		}
		if(myOptions.providers){
			providers = myOptions.providers;
		}else{
			if(myOptions.googleAPIKey) providers.push("Google");
			if(myOptions.bingAPIKey) providers.push("Bing");
			if(myOptions.openstreetmap) providers.push("OSM");
		}
		var notRandomNumber = [];
		for(var key in providers){
			for (var i = 0; i < probability[key]; i++) {
				notRandomNumber.push(key);
			}
		}
		var idx = Math.floor(Math.random() * notRandomNumber.length);
		if(providers[notRandomNumber[idx]] == "Google"){
			Logix360GeoTools.requestReverseGeoCodeGoogle(myOptions,lat,lng, function(res){
			callback (res);
			})
		}else if(providers[notRandomNumber[idx]] == "Bing"){
			Logix360GeoTools.requestReverseGeoCodeBingMaps(myOptions,lat,lng, function(res){
			callback (res);
			})
		}else if(providers[notRandomNumber[idx]] == "OSM"){
			Logix360GeoTools.requestReverseGeoCodeOSM(lat,lng, function(res){
			callback (res);
			})
		}
	},

	requestReverseGeoCodeOSM: function(lat,lng,callback) {
		if (lat.lat && lat.lng) {
			callback = lng
			lng = lat.lng
			lat = lat.lat
		};

		var query = 'lat='+lat.toString() + '&lon=' + lng.toString() + '&zoom=18&addressdetails=1',
				options = {
					host : 'nominatim.openstreetmap.org',
					path: '/reverse?format=json&' + query
				};
		var req = https.get(options, function(res) {
			if(res.statusCode === 429){
				callback(new Error ("OSM Returned..Too Many Request"));
				return;
			}
			console.log('Response: ' + res.statusCode);
			var results = '';
			res.on('error', function(e) {
				console.log('Got error: ' + e.message);
			});
			res.on('data', function(data) {
				results += data;
			});
			res.on('end', function() {
				var body = JSON.parse(results);
				if (body.error_message) {
					console.log(body.error_message);
					return;
				}
				var address = body;
				if (callback) {
					callback(address);
				} else {
					return address;
				};
			});
		});
	},

	requestReverseGeoCodeBingMaps: function(myOptions,lat,lng,callback) {
		if (lat.lat && lat.lng) {
			callback = lng
			lng = lat.lng
			lat = lat.lat
		};
		var query = lat.toString() + ',' + lng.toString() + '?o=json&key='+myOptions.bingAPIKey,
				options = {
					host : 'dev.virtualearth.net',
					path: '/REST/V1/Locations/' + query
				};
		var req = https.get(options, function(res) {
			console.log('Response: ' + res.statusCode);
			var results = '';
			res.on('error', function(e) {
				console.log('Got error: ' + e.message);
			});
			res.on('data', function(data) {
				results += data;
			});
			res.on('end', function() {
				var body = JSON.parse(results);
				if (body.error_message) {
					console.log(body.error_message);
					return;
				}
				var address = Logix360GeoTools.parseReverseGeoBingResuts(body)
				if (callback) {
					callback(address);
				} else {
					return address;
				};
			});
		});
	},

	parseReverseGeoBingResuts: function(data) {
		var address = {
			provider: "Bing",
			full_address : data.resourceSets[0].resources[0].address.formattedAddress
		}

		if(data.resourceSets[0].resources[0].address.addressLine){
			address.street_number = data.resourceSets[0].resources[0].address.addressLine;
		}
		if(data.resourceSets[0].resources[0].address.adminDistrict){
			address.municipality = data.resourceSets[0].resources[0].address.adminDistrict;
		}
		if(data.resourceSets[0].resources[0].address.adminDistrict2){
			address.city = data.resourceSets[0].resources[0].address.adminDistrict2;
		}
		if(data.resourceSets[0].resources[0].address.countryRegion){
			address.country = data.resourceSets[0].resources[0].address.countryRegion;
		}
		if(data.resourceSets[0].resources[0].address.locality){
			address.municipality2 = data.resourceSets[0].resources[0].address.locality;
		}
		return address;
	},

	requestReverseGeoCodeGoogle: function(myOptions,lat,lng,callback) {
		if (lat.lat && lat.lng) {
			callback = lng
			lng = lat.lng
			lat = lat.lat
		};
		var query = lat.toString() + ',' + lng.toString() + '&sensor=false',
				options = {
					host : 'maps.googleapis.com',
					path: '/maps/api/geocode/json?latlng=' + query + '&key=' + myOptions.googleAPIKey
				};
		var req = https.get(options, function(res) {
			console.log('Response: ' + res.statusCode);
			var results = '';
			res.on('error', function(e) {
				console.log('Got error: ' + e.message);
			});
			res.on('data', function(data) {
				results += data;
			});
			res.on('end', function() {
				var body = JSON.parse(results);
				if (body.error_message) {
					console.log(body.error_message);
					return;
				}
				var address = Logix360GeoTools.parseReverseGeoAddressGoogle(body)
				if (callback) {
					callback(address);
				} else {
					return address;
				};
			});
		});
	},

	parseReverseGeoAddressGoogle: function(data){
		var address = {
			provider: "Google",
			full_address : data.results[0].formatted_address
		},
		addressJSON = data.results[0].address_components;
		for (var i = 0; i < addressJSON.length; i++) {
			switch (addressJSON[i].types[0]) {
				case 'street_number':
					address.street_number = addressJSON[i].long_name;
					break;
				case 'route':
					address.street = addressJSON[i].long_name;
					break;
				case 'neighborhood':
					address.neighborhood = addressJSON[i].long_name;
					break;
				case 'locality' || 'sublocality':
					address.city = addressJSON[i].long_name;
					break;
				case 'administrative_area_level_2':
					address.municipality2 = addressJSON[i].long_name;
					break;
				case 'administrative_area_level_1':
					address.municipality = addressJSON[i].long_name;
					break;
				case 'country':
					address.country = addressJSON[i].long_name;
					break;
				case 'postal_code':
					address.postal_code = addressJSON[i].long_name;
					break;
			};
		};
		return address;
	},

	computeDistanceInKm: function (lat1, lng1, lat2, lng2) {
		//Check if point or Object.. if object with lat and lng assign to variable
		if (lat1.lat && lng1.lat) {
			lat2 = lng1.lat
			lng2 = lng1.lng
			lng1 = lat1.lng
			lat1 = lat1.lat
		}
		if(Logix360GeoTools.distanceArgumentCheck(lat1, lng1, lat2, lng2) === false){
			return false;
		}
		var R = 6371, // km
				dLat = Logix360GeoTools.degToRad(lat2-lat1),
				dLng = Logix360GeoTools.degToRad(lng2-lng1),
				lat1 = Logix360GeoTools.degToRad(lat1),
				lat2 = Logix360GeoTools.degToRad(lat2);

		var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
		        Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2),
				x = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)),
				d = R * x;
		return d; // Distance in km
	},

	computeDistanceInMiles: function (lat1, lng1, lat2, lng2){
		return Logix360GeoTools.kmToMiles(Logix360GeoTools.computeDistanceInKm(lat1, lng1, lat2, lng2));
	},

	computeDistanceInMeters: function (lat1, lng1, lat2, lng2){
		return Logix360GeoTools.kmToMeters(Logix360GeoTools.computeDistanceInKm(lat1, lng1, lat2, lng2));
	},

	distanceArgumentCheck: function(lat1, lng1, lat2, lng2) {
		for (var i = 0; i < arguments.length; i++){
			if (typeof arguments[i] !== 'number' || parseFloat(arguments[i]) === NaN) {
				return false;

			};
		};
	},

  checkCoordinates(point){
    if ((typeof point.lat !== 'number' || parseFloat(point.lat) === NaN) && (typeof point.lng !== 'number' || parseFloat(point.lng) === NaN)) {
			return false;
    };
  },

  degToRad: function(deg) {
	    return deg * Math.PI / 180;
	},

	kmToMiles: function(km) {
		if(parseFloat(km) === NaN || km === false){
			return false;
		}else{
			return km * 0.621371;
		}
	},

	kmToMeters: function(km) {
		if(parseFloat(km) === NaN || km === false){
			return false;
		}else{
			return km * 1000;
		}
	},

	kmToYards: function(km) {
		if(parseFloat(km) === NaN || km === false){
			return false;
		}else{
			return km * 1093.61;
		}
	},

	kmToFeet: function(km) {
		if(parseFloat(km) === NaN || km === false){
			return false;
		}else{
			return km * 3280.84;
		}
	}
};

module.exports = Logix360GeoTools;
