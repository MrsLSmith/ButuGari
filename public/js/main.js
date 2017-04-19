// Initialize Firebase
var config = {
  apiKey: "AIzaSyCTWzaphBeGiFTQudslGlBrQOi53Lnla20",
  authDomain: "butu-gari-1492447611966.firebaseapp.com",
  databaseURL: "https://butu-gari-1492447611966.firebaseio.com",
  projectId: "butu-gari-1492447611966",
  storageBucket: "butu-gari-1492447611966.appspot.com",
  messagingSenderId: "359268417162"
};
firebase.initializeApp(config);
var rootRef = firebase.database().ref();


//Geolocation
function initGeolocation()
{
   if (navigator.geolocation) {
      // Call getCurrentPosition with success and failure callbacks
      navigator.geolocation.getCurrentPosition( success, fail );
   } else {
      alert("Sorry, your browser does not support geolocation services.");
   }
}
function success(position) {
    let linkP = document.getElementById('linkP');
    let long = document.getElementById('long').value = position.coords.longitude;
    let lat = document.getElementById('lat').value = position.coords.latitude;

    let link = document.createElement('a');
	  let geoKey = "AIzaSyDXgDWfraFVxGVCyiw8TMeY_SWsS-w14tM";
	  let mapKey = "AIzaSyCZgD0Sfe4nwX4ClU2nUkTBb6pgiezVyPc";
	  let mapLink = "https://www.google.com/maps/embed/v1/place?q="+position.coords.latitude+","+position.coords.longitude+"&key="+mapKey;
	  let jsonLink = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+position.coords.latitude+","+position.coords.longitude+"&key="+geoKey;

	  document.getElementById('map').src = mapLink;
    document.getElementById('map').style.display = "block";
	  link.setAttribute('href',jsonLink);
    link.innerHTML = "View location JSON";
    linkP.appendChild(link);
}
function fail() {
   document.getElementById('long').value = "Cannot retrieve coordinates";
}


//Sign in
var provider = new firebase.auth.GoogleAuthProvider();
function googleSignin() {
   firebase.auth()
   .signInWithPopup(provider).then(function(result) {
      document.getElementById('signIn').style.display = "none";
      document.getElementById('signOut').style.display = "block";
   }).catch(function(error) {
      console.log(error.code)
      console.log(error.message)
   });
}
function googleSignout() {
   firebase.auth().signOut()
   .then(function() {
      console.log('Signout Successfull')
      document.getElementById('signOut').style.display = "none";
      document.getElementById('signIn').style.display = "block";
   }, function(error) {
      console.log('Signout Failed')  
   });
}


