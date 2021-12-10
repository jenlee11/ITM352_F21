var express = require('express');
var app = express();
var myParser = require("body-parser"); // take data from body request and get the data 
var qs = require('qs');
var fs = require('fs'); // built in module, load in fs package to use 
var cookieParser = require('cookie-parser');
//app.use(cookieParser());

//session is not accessible, username stored in server
//get cookie with session ID -> get ID and thinks its another user (session hijacking)
//to avoid -> encrypt cookies
app.use(cookieParser());
var session = require('express-session');
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));

// set sessions
app.get('/set_session', function (request, response, next) {
    response.send(`Welcome, your session id is ${request.session.id}`) //  set session id
    next();
});

//  sessions
app.get('/use_session', function (request, response, next) {
    response.send(`Your session id is ${request.session.id}`) //  set session id
    request.session.destroy();
    next();
});


// 1a
app.get('/set_cookie', function (request, response, next) {
    // console.log(request.cookies); // will have any cookies that came with the request
    let my_name = 'Jen';
    now = new Date();
    response.cookie('my_name', my_name, { expire: 5000 + now.getTime() });
    response.send(`Cookie for ${my_name} sent`); // send cookie data to client
    next();
});

// Ex. 1a
app.get('/use_cookie', function (request, response, next) {
    // console.log(request.cookies); // will have any cookies that came with the request
    if (typeof request.cookies["username"] != 'undefined') {
        let username = request.cookies["username"];
        response.cookie('username', username_entered, { "maxAge": 10 * 1000 });
        response.send(`${user_data[username]["name"]} is logged in!`);
    } else {
        response.send("You are not logged in");
    }
    next();
});

// Read user data file
var user_data_file = './user_data.json';
if (fs.existsSync(user_data_file)) { // Check to see if file exists
    var file_stats = fs.statSync(user_data_file);
    var user_data = JSON.parse(fs.readFileSync(user_data_file, 'utf-8')); // return string, parse into object, set object value to user_data
}
else {
    console.log(`${user_data_file} does not exist!`);
}

app.all('*', function (request, response, next) {
    console.log(request);
    console.log(request.method, request.path);
    next();
});

app.post('/process_register', function (request, response) {
    // Add a new user to the database
    username = request.body["username"];
    if (typeof user_data[username] == 'undefined') {
        user_data[username] = {}; // Assign username an empty object 
        if (username['psw'] == username['psw-repeat']) {
            user_data[username]["password"] = request.body["psw"]; // Assign password_entered to password of username
        }
        else {
            response.send('Passwords do not match');
        }
        user_data[username].email = request.body["email"]; // Assign email_entered to email of username
        user_data[username].name = request.body["fullname"]; // Assign name_entered to name of username
        // Save updated user_data to file
        fs.writeFileSync(user_data_file, JSON.stringify(user_data));
        response.send(`${username} is registered!`);
        response.redirect('./login.html');
    } else {
        response.send(`${username} is taken`);
    }
});


app.get("/login", function (request, response) {
    if (typeof request.cookie['username'] != 'undefined') {
        logged_in = `${request.cookie['username']} is already logged in`;
        return;
    }
    if (typeof request.session['last_login'] != 'undefined') {
        last_login = 'Last login time was ' + request.session['last_login'];
    } else {
        last_login = "First time login";
    }

    console.log(request);
    // Give simple login form
    var str = `
    <body>
    <br>
    Last Login: ${last_login}
    <br>
    <form action="process_login" method="POST">
    <input type="text" name="username" size="50" placeholder="enter username"><br>
    <input type="password" name="psw" size="50" placeholder="enter password"><br>
    <input type="submit" value="Submit" id="submit">
    </form>
    </body>
    `;
    response.send(str);
});


// This processes the login form 
app.post('/process_login', function (request, response, next) { // Post to process login then execute function
    if (typeof request.session['last_login'] != 'undefined') { // if i have this, update it and say last login
        console.log('Last login time was ' + request.session['last_login']);
    } else { // if undefined, first time
        console.log("First time login");
    }
    request.session['last_login'] = Date();
    console.log(request.body); // Output request body in console, data from form put into post request
    let username_entered = request.body["uname"];
    let password_entered = request.body["psw"];
    if (typeof user_data[username_entered] != 'undefined') { // check the username entered is in the user data
        if (user_data[username_entered]['password'] == password_entered) { // check the username_entered and password_entered matches the password in their user data
            response.cookie('username', username_entered, { "maxAge": 10 * 1000 }); // send cookie to browser from server
            response.send(`${username_entered} is logged in`); // if password_entered matches password in the user_data, send response saying "user is logged in"
        } else {
            response.send(`${username_entered} password is incorrect`); // if password_entered does not match password in the user_data, send response saying "password is incorrect"
        }
    } else {
        response.send(`${username_entered} not found`); // if username entered is not in the user data, send error that username entered is not found
    }
});

// this processes the register form 
app.post('/process_register', function (request, response, next) {
    response.send(request.body);
    response.redirect('./login.html');
})

app.listen(8080, () => console.log(`listening on port 8080`));