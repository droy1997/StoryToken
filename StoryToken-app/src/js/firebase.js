const firebaseConfig = {
    apiKey: "AIzaSyDsWJ0Kdme4vfWM6_bcyAyHxDz8mBgUXW8",
    authDomain: "storytoken-13ea1.firebaseapp.com",
    databaseURL: "https://storytoken-13ea1-default-rtdb.firebaseio.com",
    projectId: "storytoken-13ea1",
    storageBucket: "storytoken-13ea1.appspot.com",
    messagingSenderId: "834383228086",
    appId: "1:834383228086:web:584ac8a1fb51c2fed74a17"
  };

  // initialize firebase
  firebase.initializeApp(firebaseConfig);
  var storyTokenDB = firebase.database().ref("storyToken");
  //reference your database
  function getAllData() {
    return new Promise(function(resolve, reject) {
      storyTokenDB.on("value", function(snapshot) {
        var data = snapshot.val();
        resolve(data);
      }, function(error) {
        reject(error);
      });
    });
  }

  function addToDB(tokenId, book_name, book_author, book_publisher, book_year) {
    storyTokenDB.child(tokenId).set({   //change it to push
        book_name: book_name,
        book_author: book_author,
        book_publisher: book_publisher,
        book_year: book_year
    });;
  }