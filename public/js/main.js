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
var name, email, photoURL;
var lat, long, address;
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
      document.addEventListener("mousemove", userAction, false);
      document.addEventListener("click", userAction, false);
      document.addEventListener("scroll", userAction, false);
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
      usersRef.child(user.uid).once('value', function(snapshot) {
        var exists = (snapshot.val() !== null);
        ifExistingUser(exists);
      });

      function ifExistingUser(exists) {
        if (exists) {
          // Existing user, only update:
          usersRef.child(user.uid).update({
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
          });
        } else {
          // New user, set:
          usersRef.update({
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
      // Remove address
      document.getElementById('JSONParent').style.display = 'none';
      // Remove friend connections
      document.getElementById('nearbyFriendsContainer').style.display = 'none';
      // Remove user's lat/long
      var usersRefLocation = usersRef.child(currentUser.uid);
      usersRefLocation.update({
        location: {
          lat: "",
          long: "",
          address: ""
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
  location.reload();
}

function manageFriends() {
  var modal = document.getElementById('manageProfileContainer');
  var friendsContent = document.getElementById('friends-content');
  var friendsButton = document.getElementById('myFriendsButton');
  var addFriendsButton = document.getElementById('addFriendsButton');

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
        prevRequestsAccept.innerHTML = "&#10004;";
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

        for (var i = 0; i < receivedRequestsDOM.childNodes.length; i++) {
          if (receivedRequestsDOM.childNodes[i].innerHTML == requests.val()) {
            receivedRequestsDOM.childNodes[i].remove(); // Remove all identical children
            receivedRequestsDOM.appendChild(prevRequestsLi); // Append only one child
          }
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

        var removeRequest = document.createElement('button');
        removeRequest.className = 'remove';
        removeRequest.innerHTML = '&#10006;';
        prevRequestsLi.appendChild(removeRequest);

        removeRequest.onclick = function() {
          prevRequestsLi.remove();
          usersRef.child(requests.key).child('friends').child('receivedRequests').child(currentUser.uid).remove();
          usersRef.child(currentUser.uid).child('friends').child('sentRequests').child(requests.key).remove();
        }

        for (var i = 0; i < sentRequestsDOM.childNodes.length; i++) {
          if (sentRequestsDOM.childNodes[i].innerHTML == requests.val()) {
            sentRequestsDOM.childNodes[i].remove(); // Remove all identical children
            sentRequestsDOM.appendChild(prevRequestsLi); // Append only one child
          }
        }
      }
    });
  });
  // Handle accepted DOM elements
  var acceptedRequestsDOM = document.getElementById('acceptedRequests');
  var acceptedRequests = usersRef.child(currentUser.uid).child('friends').child('acceptedRequests');
  acceptedRequests.on('value', function(snap) {
    var acceptedLength = snap.numChildren();
    snap.forEach(function(requests) {
      if (requests.val() !== 'placeholder') {

        var prevAcceptedLi = document.createElement('li');
        prevAcceptedLi.innerHTML = requests.val();
        acceptedRequestsDOM.appendChild(prevAcceptedLi);

        for (var i = 0; i < acceptedRequestsDOM.childNodes.length; i++) {
          if (acceptedRequestsDOM.childNodes[i].innerHTML == requests.val()) {
            acceptedRequestsDOM.childNodes[i].remove(); // Remove all identical children
            acceptedRequestsDOM.appendChild(prevAcceptedLi); // Append only one child
          }
        }

        var removeFriend = document.createElement('button');
        removeFriend.className = 'remove';
        removeFriend.innerHTML = '&#10006;';
        prevAcceptedLi.appendChild(removeFriend);

        removeFriend.onclick = function() {
          prevAcceptedLi.remove();
          usersRef.child(requests.key).child('friends').child('acceptedRequests').child(currentUser.uid).remove();
          usersRef.child(currentUser.uid).child('friends').child('acceptedRequests').child(requests.key).remove();
        }
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

      var emailExists;
      var requestEmail = addFriendsInput.value;
      usersRef
        .orderByChild('email')
        .startAt(requestEmail)
        .endAt(requestEmail)
        .once('value', function(snap){
            snap.forEach(function(users) {
              emailExists = true;

              var friendExists;
              usersRef.child(currentUser.uid).child('friends').child('acceptedRequests').child(users.key).once('value', function(snapshot) {
                friendExists = (snapshot.val() !== null);
              });

              var requestExists;
              usersRef.child(currentUser.uid).child('friends').child('sentRequests').child(users.key).once('value', function(snapshot) {
                requestExists = (snapshot.val() !== null);
              });

              if (!requestExists && !friendExists) {
                usersRef.child(currentUser.uid).child('friends').child('sentRequests').update({
                  [users.key]: users.val().email,
                });
                usersRef.child(users.key).child('friends').child('receivedRequests').update({
                  [currentUser.uid]: currentUser.email,
                });
              } else if (requestExists) {
                alert("You've already sent this user a request!");
              } else if (friendExists) {
                alert("You're already friends with this user!");
              } else {
                alert("An error occured, please try again.");
              }
            });
      });

      setTimeout(function() {
        if (emailExists !== true) {
          alert('There is no existing user with that email.');
        }
      }, 500);
    }

    newModal.appendChild(newModalContent);
    newModalContent.appendChild(addFriendsLabel);
    newModalContent.appendChild(close);
    newModalContent.appendChild(addFriendsInput);
    newModalContent.appendChild(sendFriendRequest);
    friendsContent.appendChild(newModal);
    newModal.style.display = 'block';
  };

  // Exit events
  if (friendsContent.style.display == 'none') { // Friends tab open
    friendsContent.style.display = 'block';
    friendsButton.style.backgroundColor = '#EADE51';
    friendsButton.innerHTML = "Friends &#9660;";
  } else { // Friends tab closed
    friendsContent.style.display = 'none';
    friendsButton.style.backgroundColor = '#fefefe';
    friendsButton.innerHTML = "Friends &#9658;";
    sentRequestsDOM.childNodes.remove();
    receivedRequestsDOM.childNodes.remove();
    acceptedRequestsDOM.childNodes.remove();
  }
  window.onclick = function(e) {
    if (event.target == modal) {
      modal.style.display = "none";
      friendsContent.style.display = 'none';
      friendsButton.style.backgroundColor = '#fefefe';
      friendsButton.innerHTML = "Friends &#9658;";
      sentRequestsDOM.childNodes.remove();
      receivedRequestsDOM.childNodes.remove();
      acceptedRequestsDOM.childNodes.remove();
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
    // Convert link to an address
    let jsonLinkObject = JSON.parse(getJSON(jsonLink));
    address = jsonLinkObject.results[0].formatted_address;

    // Update map and json link
    map.src = mapLink;
    map.style.display = "block";
    // Create JSON link element
    let JSONParent = document.getElementById('JSONParent');
    JSONParent.innerHTML = address;
    JSONParent.style.display = 'block';
    // Add a new data set entry to the Firebase Database.
    var usersRefLocation = usersRef.child(currentUser.uid);
    usersRefLocation.update({
      location: {
        lat: lat,
        long: long,
        address: address
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
        usersRef.child(friend.key).child('location').once('value').then(function(snapshot){
          if (snapshot.val().address !== "") {
            var nearbyFriendsContainer = document.getElementById('nearbyFriendsContainer');
            nearbyFriendsContainer.style.display = 'block';
            var nearbyFriend = document.createElement('ol');
            var nearbyFriendLi = document.createElement('li')
            nearbyFriendLi.innerHTML = friend.val();
            nearbyFriend.appendChild(nearbyFriendLi);
            nearbyFriendsContainer.appendChild(nearbyFriend);

            var nearbyFriendAddress = document.createElement('ul');
            var nearbyFriendAddressLi = document.createElement('li');
            nearbyFriendAddressLi.innerHTML = snapshot.val().address;
            nearbyFriendAddress.appendChild(nearbyFriendAddressLi);
            nearbyFriend.appendChild(nearbyFriendAddress);

            var acceptConnection = document.createElement('button');
            acceptConnection.className = 'accept';
            acceptConnection.innerHTML = "&#10004;";
            nearbyFriendLi.appendChild(acceptConnection);
            acceptConnection.onclick = function() {
              friendConnect(nearbyFriend, nearbyFriendAddressLi.innerHTML);
            };
          }
        });
      }
    });
  });
}

function friendConnect(nearbyFriend, friendAddress) {
  var currentAddress = document.getElementById('JSONParent').innerHTML;
  if (currentAddress !== "") {
    var key = "AIzaSyCZgD0Sfe4nwX4ClU2nUkTBb6pgiezVyPc";
    var directionsLink = "https://www.google.com/maps/embed/v1/directions?key=" + key + "&origin=" + currentAddress + "&destination=" + friendAddress;

    nearbyFriend.remove();
    document.getElementById('map').src = directionsLink;

    document.getElementById('getDirectionsButton').style.display = 'block';
    var getDirections = document.getElementById('getDirections');
    getDirections.setAttribute('href', 'geo:0,0?q=' + friendAddress);

    document.getElementById('getDirectionsButton').onclick = function() {
      document.getElementById('getDirectionsButton').style.display = 'none';
    }
  } else {
    alert('Please Broadcast your location before performing this action!');
  }
}

window.onload = ButuGari;

// Get json from link
function getJSON(url) {
    var resp ;
    var xmlHttp ;

    resp  = '' ;
    xmlHttp = new XMLHttpRequest();

    if(xmlHttp != null) {
        xmlHttp.open( "GET", url, false );
        xmlHttp.send( null );
        resp = xmlHttp.responseText;
    }
    return resp ;
}

// Inactivity timeout
function debounce(callback, timeout, _this) {
    var timer;
    return function(e) {
        var _that = this;
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(function() {
            callback.call(_this || _that, e);
        }, timeout);
    }
}
var userAction = debounce(function(e) {
    signOut();
    console.log('Inactivity for 5 minutes, automatically signed out.')
}, 5*60*1000); // 5 minutes

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
