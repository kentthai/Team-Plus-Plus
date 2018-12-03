var inputElem = document.querySelector(".chatMessage");
var contacts = document.querySelector("#contacts").children[0];
var messages = document.querySelector(".messages").children[0];
var userDisplayName = document.querySelector("#userDisplayName");
var chatroomDisplayName = document.querySelector("#chatroomDisplayName");

var userId;
var teamId;

var chatRef;
var othersRef;

// Variables to keep track of what kind of chat user is viewing
var inDM = false;
var inAnnounce = false;

// Keeps track if current user is an admin of the current team
var isAdmin = false;

firebase.auth().onAuthStateChanged(async function(user) {
  // User is signed in: set userId and teamId
  if (user) {
    userId = user.uid;

    var ref = firebase.database().ref("Users/" + userId);
    await loadTeamId(ref);

    // Check values
    console.log("userId has been set: " + userId);
    //console.log("teamId has been set: " + teamId);
  }
  // No user is signed in.
  else {
  }
});

async function loadTeamId(ref) {
  return ref.once("value").then(function(snapshot) {
    teamId = snapshot.val().currTeam;
  });
}

function signOut() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log("Signing out");
      firebase.auth().signOut();
    }
  });
}

// Determines if current user is an admin
function checkAdmin(ref) {
  ref.once("value").then(function(snapshot) {
    // Check if the current user is the same as the admin listed on team
    isAdmin = userId == snapshot.val().admin;
  });
}

// Sets up HTML elements on announcements page
function setUpAnnounce() {
  // Display name of the chatroom
  chatroomDisplayName.innerHTML = "Announcements";

  // Set type of chatroom
  inDM = false;
  inAnnounce = true;

  // Call checkAdmin to set isAdmin
  var adminRef = firebase.database().ref("Team/" + teamId);
  checkAdmin(adminRef);

  // Set reference to Announcements page on firebase
  chatRef = firebase
    .database()
    .ref("/Team/" + teamId + "/Chatroom/Announcements/AnnouncementsExt");

  // Removes all messages in the message window
  while (messages.firstChild) {
    messages.removeChild(messages.firstChild);
  }

  // Fill in chat window
  chatRef.child("msgArray").on("child_added", snapshot => {
    //FIXME!!!!!!!!!!!!!!!!
    // Iterate through each message
    //snapshot.forEach(snapshot => {

    console.log("Message: " + snapshot.val().message);
    console.log("Sender: " + snapshot.val().sender);

    var inputMsg = snapshot.val().message;
    var timestamp = snapshot.val().time;

    createHTMLMessage(inputMsg, "server", timestamp);
  });
}

// Wait for log in to work so we don't get a null uid
setTimeout(function() {
  console.log("Ready to fill contacts!");

  console.log("userID: " + userId);
  console.log("teamId: " + teamId);

  /** Set Name **/
  var userRef = firebase.database().ref("/Users/" + userId); //FIXME!!!!!!!!!!!!!!!!!!
  userRef.on("value", snapshot => {
    userDisplayName.innerHTML = snapshot.val().Name;
  });

  /** Announcements **/
  var announcementsRef = firebase
    .database()
    .ref("/Team/" + teamId + "/Chatroom/Announcements"); //FIXME!!!!!!!!!!!!!!!!!!
  announcementsRef.on("child_added", snapshot => {
    // Fetch latest message on announcements
    //var latestMsg = snapshot.val()[0];		// FIXME: Make function to get latest msg !!!!!!!!!!!!!!
    var latestMsg = snapshot.val().mostRecent;

    // Truncates lates message if too long
    if (latestMsg.length > 25) {
      latestMsg = latestMsg.substring(0, 25) + "...";
    }

    // Create elements of contact
    var li = document.createElement("li");
    var div1 = document.createElement("div");
    var img = document.createElement("img");
    var div2 = document.createElement("div");
    var p1 = document.createElement("p");
    var p2 = document.createElement("p");

    // Edit attributes
    li.className += "contact";
    div1.className += "wrap";
    img.src += "img/eggperson.jpeg";
    div2.className += "meta";
    p1.className += "name";

    // FIXME: Add online status !!!
    div1.onclick = function() {
      setUpAnnounce();
    };

    // Add text
    p1.innerHTML += "Announcements";
    p2.innerHTML += latestMsg;

    // Nest elements
    div2.appendChild(p1);
    div2.appendChild(p2);
    div1.appendChild(img);
    div1.appendChild(div2);
    li.appendChild(div1);

    // Add to HTML
    contacts.appendChild(li);
  });
  /** Announcements **/

  /** Chatrooms **/
  var chatroomsRef = firebase
    .database()
    .ref("/Team/" + teamId + "/Chatroom/Chatrooms"); //FIXME!!!!!!!!!!!!!!!!!!
  chatroomsRef.on("child_added", snapshot => {
    // Fetch from database
    var chatroomName = snapshot.val().chatroomName;
    var latestMsg = snapshot.val().mostRecent;

    // Truncates lates message if too long
    if (latestMsg.length > 25) {
      latestMsg = latestMsg.substring(0, 25) + "...";
    }

    // Check values
    console.log("chatroomName = " + chatroomName);

    // Create elements of contact
    var li = document.createElement("li");
    var div1 = document.createElement("div");
    var img = document.createElement("img");
    var div2 = document.createElement("div");
    var p1 = document.createElement("p");
    var p2 = document.createElement("p");

    // Edit attributes
    li.className += "contact";
    div1.className += "wrap";
    img.src += "img/eggperson.jpeg";
    div2.className += "meta";
    p1.className += "name";

    // Add ability to switch between chats
    div1.onclick = function() {
      // Display name of the chatroom
      chatroomDisplayName.innerHTML = chatroomName;

      // Set type of chatroom
      inDM = false;
      inAnnounce = false;

      // Set reference to chatrooms page on firebase
      chatRef = firebase
        .database()
        .ref("/Team/" + teamId + "/Chatroom/Chatrooms/" + chatroomName);

      // Removes all messages in the message window
      while (messages.firstChild) {
        messages.removeChild(messages.firstChild);
      }

      // Fill in chat window
      chatRef.child("msgArray").on("child_added", snapshot => {
        //FIXME!!!!!!!!!!!!!!!!
        // Iterate through each message
        //snapshot.forEach(snapshot => {

        console.log("Message: " + snapshot.val().message);
        console.log("Sender: " + snapshot.val().sender);

        var inputMsg = snapshot.val().message;
        var inputSender = snapshot.val().sender;
        var timestamp = snapshot.val().time;

        // Determine who is sending the message
        var source;
        if (inputSender == userId) {
          source = "client";
        } else {
          source = "server";
        }

        createHTMLMessage(inputMsg, source, timestamp);

        //});
      });
    };

    // FIXME: Add online status !!!

    // Add text
    p1.innerHTML += chatroomName;
    p2.innerHTML += latestMsg;

    // Nest elements
    div2.appendChild(p1);
    div2.appendChild(p2);
    div1.appendChild(img);
    div1.appendChild(div2);
    li.appendChild(div1);

    // Add to HTML
    contacts.appendChild(li);
  });
  /** Chatrooms **/

  /** Direct Messages **/
  var friendsRef = firebase
    .database()
    .ref("/Team/" + teamId + "/Chatroom/directMessages/" + userId);
  friendsRef.on("child_added", snapshot => {
    // Fetch from database
    var friendName = snapshot.val().name;
    var friendId = snapshot.val().userId;
    var latestMsg = snapshot.val().mostRecent;

    // Truncates lates message if too long
    if (latestMsg.length > 25) {
      latestMsg = latestMsg.substring(0, 25) + "...";
    }

    // Check values
    //console.log("friendName = " + friendName);
    //console.log("friendId = " + friendId);

    // Create elements of contact
    var li = document.createElement("li");
    var div1 = document.createElement("div");
    var img = document.createElement("img");
    var div2 = document.createElement("div");
    var p1 = document.createElement("p");
    var p2 = document.createElement("p");

    // Edit attributes
    li.className += "contact";
    div1.className += "wrap";
    img.src += "img/eggperson.jpeg";
    div2.className += "meta";
    p1.className += "name";

    // Add ability to switch between chats
    div1.onclick = function() {
      // Display name of the chatroom
      chatroomDisplayName.innerHTML = friendName;

      // Variable to determine if we are in DMs
      inDM = true;
      inAnnounce = false;

      // Set references for saving messages in both user's messages
      chatRef = firebase
        .database()
        .ref(
          "/Team/" +
            teamId +
            "/Chatroom/directMessages/" +
            userId +
            "/" +
            friendId
        );
      othersRef = firebase
        .database()
        .ref(
          "/Team/" +
            teamId +
            "/Chatroom/directMessages/" +
            friendId +
            "/" +
            userId
        );

      // Removes all messages in the message window
      while (messages.firstChild) {
        messages.removeChild(messages.firstChild);
      }

      // Fill in chat window
      chatRef.child("msgArray").on("child_added", snapshot => {
        //FIXME!!!!!!!!!!!!!!!!
        // Iterate through each message
        //snapshot.forEach(snapshot => {

        console.log("Message: " + snapshot.val().message);
        console.log("Sender: " + snapshot.val().sender);

        var inputMsg = snapshot.val().message;
        var inputSender = snapshot.val().sender;
        var timestamp = snapshot.val().time;

        // Determine who is sending the message
        var source;
        if (inputSender == userId) {
          source = "client";
        } else {
          source = "server";
        }

        createHTMLMessage(inputMsg, source, timestamp);

        //});
      });
    };

    // FIXME: Add online status !!!

    // Add text
    p1.innerHTML += friendName;
    p2.innerHTML += latestMsg;

    // Nest elements
    div2.appendChild(p1);
    div2.appendChild(p2);
    div1.appendChild(img);
    div1.appendChild(div2);
    li.appendChild(div1);

    // Add to HTML
    contacts.appendChild(li);
  });
  /** Direct Messages **/

  // Start at the announcements page
  setUpAnnounce();
}, 1500);

/**
 * Updates message database
 */
function updateMessageDatabase(msg) {
  console.log("isAdmin = " + isAdmin);
  console.log("inAnnounce = " + inAnnounce);

  // Only let admins post to announcements
  if ((inAnnounce && isAdmin) || !inAnnounce) {
    // Write to database
    // Create a new post reference with an auto-generated id

    console.log("Inside updateMessageDatabase: chatRef = " + chatRef);

    // Gets the current time for timestamp
    var serverTime;
    var myDate;
    firebase
      .database()
      .ref("/.info/serverTimeOffset")
      .once("value", function(snapshot) {
        //var offsetVal = offset.val() || 0;
        //serverTime = Date.now() + offsetVal;

        var offset = snapshot.val();
        serverTime = new Date().getTime() + offset;
        myDate = new Date(serverTime);
      });

    console.log("serverTime = " + myDate);

    var currTime = myDate.toString().split(" ")[4];
    console.log(currTime);

    var newPostRef = chatRef.child("msgArray").push();
    newPostRef.set({
      sender: userId,
      message: msg,
      time: currTime
    });

    // Update the most recent message
    chatRef.update({
      mostRecent: msg
    });

    // If calling from directMessages then update other's too
    if (inDM) {
      // Update other member's database info
      var newPostRef = othersRef.child("msgArray").push();
      newPostRef.set({
        sender: userId,
        message: msg,
        time: currTime
      });

      // Update the most recent message
      othersRef.update({
        mostRecent: msg
      });
    }
  }
}

function createHTMLMessage(msg, source, time) {
  // Timestamp: FIXME: Formatting on html does not look nice !!!!!!!!!!!
  var div = document.createElement("p");
  div.innerHTML += time.toString();

  // Create elements of message box
  var li = document.createElement("li");
  var p = document.createElement("p");
  var img = document.createElement("img");
  p.innerHTML += msg;

  // Determine the class attribute and image to append
  if (source == "server") {
    li.className += "sent";
    img.src = "img/eggperson.jpeg";
    div.style = "padding-left: 50px; font-size: 12px";
  } else {
    li.className += "replies";
    img.src = "img/chat.jpg";
    div.style = "padding-left: 500px; font-size: 12px";
  }

  // Add img and message to li
  li.appendChild(img);
  li.appendChild(p);

  //li.appendChild(div);

  // Selects the messages class to always scroll to bottom
  const messagesCont = document.querySelector(".messages");
  shouldScroll =
    messagesCont.scrollTop + messagesCont.clientHeight ===
    messagesCont.scrollHeight;
  if (!shouldScroll) {
    messagesCont.scrollTop = messagesCont.scrollHeight;
  }

  // Put html element on page
  messages.append(li);

  messages.append(div);
}

inputElem.addEventListener("keypress", function(e) {
  var key = e.which || e.keyCode;
  if (key === 13) {
    // Checked if the user entered anything
    if (inputElem.value != "") {
      updateMessageDatabase(inputElem.value);
      inputElem.value = "";
    }
  }
});
