var https = require('https');
var url = require('url');

var Logix360GeoTools = {

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
  // Converts numeric degrees to radians. Used in computeDistance()
  degToRad: function(deg) {
	    return deg * Math.PI / 180;
	},

  //Converts KM into miles
	kmToMiles: function(km) {
		if(parseFloat(km) === NaN || km === false){
			return false;
		}else{
			return km * 0.621371;
		}
	},

	//Converts KM into meters
	kmToMeters: function(km) {
		if(parseFloat(km) === NaN || km === false){
			return false;
		}else{
			return km * 1000;
		}
	},

	//Converts KM into yards
	kmToYards: function(km) {
		if(parseFloat(km) === NaN || km === false){
			return false;
		}else{
			return km * 1093.61;
		}
	},

	//Converts KM into feet
	kmToFeet: function(km) {
		if(parseFloat(km) === NaN || km === false){
			return false;
		}else{
			return km * 3280.84;
		}
	}
};

module.exports = Logix360GeoTools;
