'use strict';

var config = {
    apiKey: "AIzaSyCTWzaphBeGiFTQudslGlBrQOi53Lnla20",
    authDomain: "butu-gari-1492447611966.firebaseapp.com",
    databaseURL: "https://butu-gari-1492447611966.firebaseio.com",
    projectId: "butu-gari-1492447611966",
    storageBucket: "butu-gari-1492447611966.appspot.com",
    messagingSenderId: "359268417162"
};
firebase.initializeApp(config);

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

// Initializes ButuGari.
function ButuGari() {
  // Shortcuts to DOM Elements.
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.userEmail = document.getElementById('user-email');
  this.signInButton = document.getElementById('signInButton');
  this.signOutButton = document.getElementById('signOutButton');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');
  this.getGeolocationButton = document.getElementById('geolocationButton');
  this.getConnectionsButton = document.getElementById('connectionsButton');
  // Sign in/out handlers
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));
  // Geolocation handler
  this.getGeolocationButton.addEventListener('click', this.getGeolocation.bind(this));
  // Connections handler
  this.getConnectionsButton.addEventListener('click', this.getConnections.bind(this));
  // Initialize firebase shortcuts & auth
  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
ButuGari.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Signs-in to Butu Gari.
ButuGari.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};
// Signs-out of Butu Gari.
ButuGari.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
ButuGari.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;
    var userEmail = user.email;
    // Set the user's profile pic and name.
    this.userPic.setAttribute('src', profilePicUrl || '/images/profile_placeholder.png');
    this.userName.textContent = userName;
    this.userName.style.display = "inline-block";
    this.userEmail.textContent = '(' + userEmail + ')';
    this.userEmail.style.display = "inline-block";
    // Show user's profile and sign-out button.
    this.userPic.style.display = "inline-block";
    this.signOutButton.removeAttribute('hidden');
    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.style.display = "none";
    this.userEmail.style.display = "none";
    this.userPic.style.display = "none";
    this.signOutButton.setAttribute('hidden', 'true');
    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
    // Remove lat/long input & map iframe
    document.getElementById('long').value = "";
    document.getElementById('lat').value = "";
    document.getElementById('map').style.display = "none";
    // Remove user's lat/long
    this.usersRef.update({
      [this.currentUser.uid]: {
        email: this.currentUser.email,
        name: this.currentUser.displayName,
        photoUrl: this.currentUser.photoURL || '/images/profile_placeholder.png'
      }
    });
  }
};

var lat, long;
// Retrieves and sets geolocation data
ButuGari.prototype.getGeolocation = function() {
  if (navigator.geolocation) {
      if (this.auth.currentUser) {
        // Call getCurrentPosition with success and failure callbacks
        navigator.geolocation.getCurrentPosition( success, fail );
        this.usersRef = this.database.ref('users/');
        this.currentUser = this.auth.currentUser;
        // Remove json link
        if(document.getElementById('newjsonLink')) {
          document.getElementById('newjsonLink').remove();
        }
      } else {
        alert("Please sign in before performing this action.");
      }
   } else {
      alert("Sorry, your browser does not support geolocation services.");
   }

   function success(position) {
    lat = position.coords.latitude;
    long = position.coords.longitude;
    // Get lat/long display elements
    document.getElementById('long').value = long;
    document.getElementById('lat').value = lat;
    // Get keys and create links
    let geoKey = "AIzaSyDXgDWfraFVxGVCyiw8TMeY_SWsS-w14tM";
    let mapKey = "AIzaSyCZgD0Sfe4nwX4ClU2nUkTBb6pgiezVyPc";
    let mapLink = "https://www.google.com/maps/embed/v1/place?q="+lat+","+long+"&key="+mapKey;
    let jsonLink = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+long+"&key="+geoKey;
    // Update map and json link
    document.getElementById('map').src = mapLink;
    document.getElementById('map').style.display = "block";
    // Create JSON link element
    let JSONParent = document.getElementById('JSONParent');
    let newLink = document.createElement('a');
    newLink.setAttribute('href',jsonLink);
    newLink.innerHTML = "View location JSON";
    newLink.id = "newjsonLink";
    JSONParent.appendChild(newLink);
    // Add a new data set entry to the Firebase Database.
    firebase.database().ref('users/').update({
      [firebase.auth().currentUser.uid]: {
        lat: lat,
        long: long,
        email: firebase.auth().currentUser.email,
        name: firebase.auth().currentUser.displayName,
        photoUrl: firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png'
      }
    });
  }
  function fail() {
     document.getElementById('long').value = "Cannot retrieve coordinates";
  }
};

ButuGari.prototype.getConnections = function() {
  var usersRef = firebase.database().ref('users/');
  usersRef.on('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var childData = childSnapshot.val();
      var output = '';
      for (var property in childData) {
        if (property == 'name') {
        output = childData[property];
  }
}
    var connectionsUsers = document.getElementById('connectionsUsers');

      console.log(output);
    });
  });
}

window.onload = function() {
  window.ButuGari = new ButuGari();
};
