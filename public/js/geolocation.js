function initGeolocation()
{
   if( navigator.geolocation )
   {
      // Call getCurrentPosition with success and failure callbacks
      navigator.geolocation.getCurrentPosition( success, fail );
   }
   else
   {
      alert("Sorry, your browser does not support geolocation services.");
   }
}
function success(position)
{
    document.getElementById('linkP');
    document.getElementById('long').value = position.coords.longitude;
    document.getElementById('lat').value = position.coords.latitude;
	
    let link = document.createElement('a');
	let geoKey = "AIzaSyDXgDWfraFVxGVCyiw8TMeY_SWsS-w14tM";
	let mapKey = "AIzaSyCZgD0Sfe4nwX4ClU2nUkTBb6pgiezVyPc";
	let mapLink = "https://www.google.com/maps/embed/v1/place?q="+position.coords.latitude+","+position.coords.longitude+"&key="+mapKey;
	let jsonLink = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+position.coords.latitude+","+position.coords.longitude+"&key="+geoKey;
	
	document.getElementById('map').src = mapLink;
	link.setAttribute('href',jsonLink);
    link.innerHTML = "View location JSON";
    linkP.appendChild(link);
}
function fail()
{
   document.getElementById('long').value = "Cannot retrieve coordinates";
}