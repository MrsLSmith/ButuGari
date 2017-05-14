// --------------------------------------------------
// Firebase Initialization
// --------------------------------------------------
var config = {
    apiKey: "AIzaSyCTWzaphBeGiFTQudslGlBrQOi53Lnla20",
    authDomain: "butu-gari-1492447611966.firebaseapp.com",
    databaseURL: "https://butu-gari-1492447611966.firebaseio.com",
    projectId: "butu-gari-1492447611966",
    storageBucket: "butu-gari-1492447611966.appspot.com",
    messagingSenderId: "359268417162"
};
firebase.initializeApp(config);


// --------------------------------------------------
// Global Shortcuts
// --------------------------------------------------
// Firebase references
var rootRef = firebase.database().ref();
var usersRef = firebase.database().ref('users/');
var currentUser;
var name, email, photoURL, uid;
var lat, long;
// DOM Elements
const userPicDOM = document.getElementById('user-pic');
const userNameDOM = document.getElementById('user-name');
const userEmailDOM = document.getElementById('user-email');
const signInButton = document.getElementById('signInButton');
const signOutButton = document.getElementById('signOutButton');
const manageProfileButton = document.getElementById('manageProfileButton');
const friendsButton = document.getElementById('myFriendsButton');
const requestButton = document.getElementsByClassName('geolocationButton')[0];
const broadcastButton = document.getElementsByClassName('geolocationButton')[1];
const map = document.getElementById('map');
const getConnectionsButton = document.getElementById('connectionsButton');


// --------------------------------------------------
// Functions
// --------------------------------------------------
// Initializes ButuGari.
function ButuGari() {
  // Sign in/out handlers
  signOutButton.addEventListener('click', signOut );
  signInButton.addEventListener('click', signIn );
  // Profile handlers
  manageProfileButton.addEventListener('click', manageProfile );
  friendsButton.addEventListener('click', manageFriends );
  // Geolocation handlers
  requestButton.addEventListener('click', getGeolocation );
  broadcastButton.addEventListener('click', getGeolocation );
  // Connections handlers
  getConnectionsButton.addEventListener('click', getConnections );
  // Triggers when the auth state change for instance when the user signs-in or signs-out.
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) { // User is signed in!
      currentUser = user;
      // Get profile pic and user's name from the Firebase user object.
      var profilePicUrl = user.photoURL;
      var userName = user.displayName;
      var userEmail = user.email;
      // Set the user's profile pic and name.
      userPicDOM.setAttribute('src', profilePicUrl || '/img/profile_placeholder.png');
      userNameDOM.textContent = userName;
      userNameDOM.style.display = "inline-block";
      userEmailDOM.textContent = '(' + userEmail + ')';
      userEmailDOM.style.display = "inline-block";
      // Show user's profile and sign-out button.
      userPicDOM.style.display = "inline-block";
      signOutButton.removeAttribute('hidden');
      manageProfileButton.removeAttribute('hidden');
      // Hide sign-in button.
      signInButton.setAttribute('hidden', 'true');
      // Check if existing user
      if(usersRef.child(user.uid)) {
        // Existing user, only update:
        usersRef.child(user.uid).update({
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        // New user, set:
        usersRef.set({
          [user.uid]: {
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
            friends: {
              sentRequests: {
                sent: "placeholder"
              },
              receivedRequests: {
                received: "placeholder"
              },
              acceptedRequests: {
                placeholder: "placeholder"
              }
            }
          }
        });
      }
    } else { // User is signed out!
      // Hide user's profile and sign-out button.
      userNameDOM.style.display = "none";
      userEmailDOM.style.display = "none";
      userPicDOM.style.display = "none";
      signOutButton.setAttribute('hidden', 'true');
      manageProfileButton.setAttribute('hidden', 'true');
      // Show sign-in button.
      signInButton.removeAttribute('hidden');
      // Remove map iframe
      map.style.display = "none";
      // Remove user's lat/long
      var usersRefCoordinates = usersRef.child(currentUser.uid);
      usersRefCoordinates.update({
        coordinates: {
          lat: "",
          long: ""
        }
      });
    }
  });
}

function signIn() {
  // Sign-in to Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}
function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}

function manageFriends() {
  var modal = document.getElementById('manageProfileContainer');
  var friendsContent = document.getElementById('friends-content');
  var friendsButton = document.getElementById('myFriendsButton');
  var addFriendsButton = document.getElementById('addFriendsButton');
  var acceptRequestButton = document.getElementById('acceptRequestButton');

  // Handle received DOM elements
  var receivedRequestsDOM = document.getElementById('receivedRequests');
  var receivedRequests = usersRef.child(currentUser.uid).child('friends').child('receivedRequests');
  receivedRequests.on('value', function(snap) {
    var receivedLength = snap.numChildren();
    snap.forEach(function(request) {
      if (request.val() !== 'placeholder') {
        var prevRequestsLi = document.createElement('li');
        prevRequestsLi.innerHTML = request.val();
        receivedRequestsDOM.appendChild(prevRequestsLi);

        var prevRequestsAccept = document.createElement('button');
        prevRequestsAccept.className = 'accept';
        prevRequestsAccept.innerHTML = "Accept";
        prevRequestsLi.appendChild(prevRequestsAccept);
        prevRequestsAccept.onclick = function() {
          prevRequestsLi.remove();
          usersRef.child(request.key).child('friends').child('sentRequests').child(currentUser.uid).remove();
          usersRef.child(currentUser.uid).child('friends').child('receivedRequests').child(request.key).remove();
          usersRef.child(currentUser.uid).child('friends').child('acceptedRequests').update({
            [request.key]: request.val()
          });
          usersRef.child(request.key).child('friends').child('acceptedRequests').update({
            [currentUser.uid]: currentUser.email
          });
        }
      }
    });
  });
  // Handle sent DOM elements
  var sentRequestsDOM = document.getElementById('sentRequests');
  var sentRequests = usersRef.child(currentUser.uid).child('friends').child('sentRequests');
  sentRequests.on('value', function(snap) {
    var sentLength = snap.numChildren();
    snap.forEach(function(requests) {
      if (requests.val() !== 'placeholder') {
        var prevRequestsLi = document.createElement('li');
        prevRequestsLi.innerHTML = requests.val();
        sentRequestsDOM.appendChild(prevRequestsLi);
      }
    });
  });
  // Handle currentFriends DOM elements
  var currentFriendsDOM = document.getElementById('currentFriends');
  var acceptedRequests = usersRef.child(currentUser.uid).child('friends').child('acceptedRequests');
  acceptedRequests.on('value', function(snap) {
    var acceptedLength = snap.numChildren();
    snap.forEach(function(requests) {
      if (requests.val() !== 'placeholder') {
        var prevAcceptedLi = document.createElement('li');
        prevAcceptedLi.innerHTML = requests.val();
        currentFriendsDOM.appendChild(prevAcceptedLi);
      }
    });
  });

  addFriendsButton.onclick = function() {
    var newModal = document.createElement('div');
    var newModalContent = document.createElement('div');
    newModal.className += 'modal';
    newModalContent.className += ' newModalContent';

    var addFriendsLabel = document.createElement('label');
    var addFriendsInput = document.createElement('input');
    addFriendsLabel.innerHTML = "Enter a friend's email:";
    addFriendsInput.setAttribute('type', 'text');
    addFriendsInput.style.width = '99%';

    var close = document.createElement('span');
    close.className = 'close';
    close.innerHTML = '&times;';
    close.onclick = function() {
      newModal.remove();
    }

    var sendFriendRequest = document.createElement('button');
    sendFriendRequest.innerHTML = 'Send Request';
    sendFriendRequest.onclick = function() {
      newModal.remove();

      var requestEmail = addFriendsInput.value;
      usersRef
        .orderByChild('email')
        .startAt(requestEmail)
        .endAt(requestEmail)
        .once('value', function(snap){
            snap.forEach(function(users) {
              // users.val(); // Returns entire user object
              usersRef.child(currentUser.uid).child('friends').child('sentRequests').update({
                [users.key]: users.val().email,
              });

              usersRef.child(users.key).child('friends').child('receivedRequests').update({
                [currentUser.uid]: currentUser.email,
              });
            });
      });

      var newRequest = document.createElement('li');
      if (requestEmail !== "") { // TODO: check if email is valid
        newRequest.innerHTML = requestEmail;
        sentRequestsDOM.appendChild(newRequest);
      } else {
        alert('Please enter a valid email');
      }
    }

    newModal.appendChild(newModalContent);
    newModalContent.appendChild(addFriendsLabel);
    newModalContent.appendChild(close);
    newModalContent.appendChild(addFriendsInput);
    newModalContent.appendChild(sendFriendRequest);
    friendsContent.appendChild(newModal);
    newModal.style.display = 'block';
  }

  if (friendsContent.style.display == 'none') {
    friendsContent.style.display = 'block';
    friendsButton.style.backgroundColor = '#EADE51';
    friendsButton.innerHTML = "Friends &#9660;";
  } else {
    friendsContent.style.display = 'none';
    friendsButton.style.backgroundColor = '#fefefe';
    friendsButton.innerHTML = "Friends &#9658;";
    sentRequestsDOM.childNodes.remove();
  }
  window.onclick = function(e) {
    if (event.target == modal) {
      modal.style.display = "none";
      friendsContent.style.display = 'none';
      friendsButton.style.backgroundColor = '#fefefe';
      friendsButton.innerHTML = "Friends &#9658;";
      sentRequestsDOM.childNodes.remove();
    }
  }
}

function manageProfile() {
  var modal = document.getElementById('manageProfileContainer');
  var span = document.getElementsByClassName("close")[0];

  modal.style.display = "block";

  span.onclick = function() {
    modal.style.display = "none";
  }
  window.onclick = function(e) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}

function getGeolocation() {
  if (navigator.geolocation) {
      if (firebase.auth().currentUser) {
        // Call getCurrentPosition with success and failure callbacks
        navigator.geolocation.getCurrentPosition( success, fail );
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
    // Get keys and create links
    let geoKey = "AIzaSyDXgDWfraFVxGVCyiw8TMeY_SWsS-w14tM";
    let mapKey = "AIzaSyCZgD0Sfe4nwX4ClU2nUkTBb6pgiezVyPc";
    let mapLink = "https://www.google.com/maps/embed/v1/place?q="+lat+","+long+"&key="+mapKey;
    let jsonLink = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+long+"&key="+geoKey;
    // Update map and json link
    map.src = mapLink;
    map.style.display = "block";
    // Create JSON link element
    let JSONParent = document.getElementById('JSONParent');
    let newLink = document.createElement('a');
    newLink.setAttribute('href',jsonLink);
    newLink.innerHTML = "View location JSON";
    newLink.id = "newjsonLink";
    JSONParent.appendChild(newLink);
    // Add a new data set entry to the Firebase Database.
    var usersRefCoordinates = usersRef.child(currentUser.uid);
    usersRefCoordinates.update({
      coordinates: {
        lat: lat,
        long: long
      }
    });
  }
  function fail() {
     alert('Something went wrong, please check your connection and try again.');
  }
}

function getConnections() {
  var myFriends = usersRef.child(currentUser.uid).child('friends').child('acceptedRequests');
  myFriends.on('value', function(snap) {
    snap.forEach(function(friend) {
      if (friend.val() !== 'placeholder') {
        usersRef.child(friend.key).child('coordinates').once('value').then(function(snapshot){
          if (snapshot.val().lat !== "") {
            var nearbyFriendsContainer = document.getElementById('nearbyFriendsContainer');
            var nearbyFriend = document.createElement('ol');
            var nearbyFriendLi = document.createElement('li')
            nearbyFriendLi.innerHTML = friend.val() + ' (lat, long)';
            nearbyFriend.appendChild(nearbyFriendLi);
            nearbyFriendsContainer.appendChild(nearbyFriend);

            var nearbyFriendLat = document.createElement('ul');
            var nearbyFriendLatLi = document.createElement('li');
            nearbyFriendLatLi.innerHTML = snapshot.val().lat;
            nearbyFriendLat.appendChild(nearbyFriendLatLi);
            nearbyFriend.appendChild(nearbyFriendLat);

            var nearbyFriendLong = document.createElement('ul');
            var nearbyFriendLongLi = document.createElement('li');
            nearbyFriendLongLi.innerHTML = snapshot.val().long;
            nearbyFriendLong.appendChild(nearbyFriendLongLi);
            nearbyFriend.appendChild(nearbyFriendLong);
          }
        });
      }
    });
  });
}

window.onload = ButuGari;

// Helpful DOM remove() function 
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