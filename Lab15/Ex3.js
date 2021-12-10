var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
//app.use(cookieParser());

//session is not accessible, username stored in server
//get cookie with session ID -> get ID and thinks its another user (session hijacking)
//to avoid -> encrypt cookies
var session = require('express-session');
//tell session id to be encrypted so id can't be copied
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

//if i get the route, i want to execute the function
//a cookie is data that is sent in response to the requester (browser)
//this will send a cookie to the requester
app.get('/set_cookie', function(request,response) {
    response.cookie('name','Jen', {maxAge: 5*1000});
    response.send('The name cookie has been sent')
});

//this will get the name cookie from the requester respond with a message
app.get('/use_cookie', function(request,response) {
    console.log(request.cookies);
    response.send(`Welcome to the Use Cookie page ${request.cookies.name}`)
});

//if i get the route, i want to execute the function
//a cookie is data that is sent in response to the requester (browser)
//this will send a cookie to the requester
//store sessions in database -> if server crashes, you don't lose session data
app.get('/set_cookie', function(request,response) {
    response.cookie('name','Jen', {maxAge: 5*1000});
    response.send('The name cookie has been sent')
});

//this will get the name cookie from the requester respond with a message
app.get('/use_session', function(request,response) {
    console.log(request.cookies);
    //session id should be encrypted
    response.send(`Welcome your session id is ${request.session.id}`)
});

// output login form
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');
const { static } = require('express');
const user_data_filename = 'user_data.json';

// check if file exists before reading
if (fs.existsSync(user_data_filename)) {
    stats = fs.statSync(user_data_filename);
    console.log(`user_data.json has ${stats['size']} characters`)

    var data = fs.readFileSync(user_data_filename, 'utf-8');
    user_reg_data = JSON.parse(data);

}



app.get("/register", function (request, response) {
    // register form
    str = `
<body>
<form action="process_register" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="password" name="repeat_password" size="40" placeholder="enter password again"><br />
<input type="email" name="email" size="40" placeholder="enter email"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});

app.post("/process_register", function (request, response) {
    // process a simple register form
    // response.send(request.body);
   
    // add example new user reg info
    username = request.body.username;
    user_reg_data[username] = {};
    user_reg_data[username].password = request.body.password;
    user_reg_data[username].email = request.body.email;
    
    // write updated object to user_data_filename :: needed for assignment2
    reg_info_str = JSON.stringify(user_reg_data);
    fs.writeFileSync(user_data_filename, reg_info_str);

    if (request.body.password == request.body.repeat_password) {
        response.send(`Thank you for registering`)
    }
    
});


app.get("/login", function (request, response) {
    // login form
    if(typeof request.cookies.username != 'undefined') {
        var welcome_str = 'Welcome! You need to login.';
        if(typeof request.cookies.username != 'undefined') {
           //focus
        }
    }
   
    str = `
<body>
<form action="process_login" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});

app.post("/process_login", function (request, response) {
    // process login form POST and redirect to login
    // get last login time from session if it exists. if not, create first login.
    var lastLoginTime = 'first login!'
    if(typeof request.session.lastLogin != 'undefined') {
        lastLoginTime = request.session.lastLogin;
    }

    console.log(lastLoginTime);

    console.log(request.body);
    // checks if the user exists, if yes then get pass
    if (typeof user_reg_data[request.body['username']] != 'undefined') {
        userdata = user_reg_data[request.body['username']];
        console.log(userdata)
        // ——————— lab 15
        if (request.body['password'] == userdata.password) {
            if(typeof request.session['last login'] != 'undefined') {
                var last_login = request.session['last login'];
            }
            else {
                request.session['first login'] = 'first time logging in!';
            }
            request.session.lastLogin = newDate(); //put login date into session
            response.cookie('username', the_username);
            
            response.send(`You last logged in on ${last_login}`);
            return;
        } else {
            response.send(` ${request.body['username']} password is incorrect.`);
        }
    } else {
        response.send(` ${request.body['username']} does not exist.`);
    }
});

app.listen(8080, () => console.log(`listening on port 8080`));