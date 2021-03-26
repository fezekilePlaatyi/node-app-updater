var firebaseConfig = {
    apiKey: "AIzaSyCQgaDY997tLRZY4PQoSSjgmjAHnY7otSM",
    authDomain: "hydralogger-updater.firebaseapp.com",
    databaseURL: "https://hydralogger-updater.firebaseio.com",
    projectId: "hydralogger-updater",
    storageBucket: "hydralogger-updater.appspot.com",
    messagingSenderId: "112678836121",
    appId: "1:112678836121:web:7e3660c98c22eb9f6e2508",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
function signUp() {

    var email = document.getElementById("email");
    var password = document.getElementById("password");

    const promise = auth.createUserWithEmailAndPassword(email.value, password.value);
    promise
    .then((user) => {
        if(user) {
            window.location.replace(`/production/index`);
        } else {
            window.location.replace(`/production/`);
        }
    })
    .catch(e => {
        alert(e.message)  
        window.location.replace(`/production/`);      
    });        
}

function signIn() {

    var email = document.getElementById("email");
    var password = document.getElementById("password");

    const promise = auth.signInWithEmailAndPassword(email.value, password.value);
    promise
    .then((user) => {
        if(user) {
            window.location.replace(`/production/index`);
        } else {
            window.location.replace(`/production/`);
        }
    })
    .catch(e => alert(e.message));
}

function signOut() {

    auth.signOut();
    window.location.replace(`/production/`);
}

auth.onAuthStateChanged(function(user) {

    if (user) {
        var email = user.email;
        
        if(window.location.href != "" ) {
            // window.location.replace(`/index`);
        }
    } else {
        // window.location.replace(`/`);
    }
});
