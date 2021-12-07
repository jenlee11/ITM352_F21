var fs = require('fs');
var express = require('express');
var app = express();

var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.get('/set_cookie', function (request, response){
// this will send a cookie to the requester (browser). get request and respond with cookie.
response.cookie('name', 'Jen', {maxAge: 5*1000});
response.send('The name cookie has been sent!');
});

app.get('/use_cookie', function (request, response){
    // this will get the name cookie from the requester and respond/display a message.
   // console.log(    request.cookies  );
    response.send(` Welcome to the Use Cookie page ${request.cookies.name}`);
    });


// recognize the incoming Request Object as strings or arrays
app.use(express.urlencoded({ extended: true }));

//var buf = new Buffer(1);
//var bufLength = buf.length;
//var bytesRead = bufLength;

//user info that stores in JSON file
var pos = 0;
var bytesRead = 0;
var filename = 'user_data.json';

if (fs.existsSync(filename)) {
    // have reg data file, so read data and parse into user_data_obj
        var stats = fs.statSync(filename); //return information about the given file path
        var data = fs.readFileSync(filename, 'utf-8'); // read the file and return its content.
        var user_reg_data = JSON.parse(data);
        console.log(filename + 'has'+ stats["size"] + 'characters');
    } else {
        console.log(filename + ' does not exist!');
    }    

/*
var fdr = fs.openSync(filename, 'r');
while (pos < stats["size"]) {
    bytesREad = fs.readSync(fdr, buf, 0,1, pos);
    var bufStr = buf.toString('utf8', 0, bytesRead);
    console.log(bufStr);
    //
}
*/


//add the submitted form data to users_reg_data then saves this updated object to user_data.json using JSON.stringify() 
app.get("/login", function (request, response) {
    // Give a simple login form
    str = `
<body>
<form action="" method="POST"> 
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});


app.get("/register", function (request, response) {
    // Give a simple register form
    str = `
<body>
<form action="register" method="POST">
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

app.post("/register", function (request, response) {
    username = request.body.username;
    // process a simple register form
    if (typeof users_reg_data[username] == 'undefined' && (request.body.password == request.body.repeat_password)) {
        users_reg_data[username] = {};
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;

        fs.writeFileSync('./user_data.json', JSON.stringify(users_reg_data));
        response.redirect('./login');
    } else {
        response.redirect('./register');
    }
});

app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not 
    let login_username = request.body['username'];
    let login_password = request.body['password'];
    // check if username exeist, then check password entered match password stored
    if (typeof users_reg_data[login_username] != 'undefined') {
        // take "password" and check if the password in the textbox is right
        if (users_reg_data[login_username]["password"] == login_password) {
            // if matches, 
            response.send(`${login_username} is loged in`);
        } else {
            // if the password doesn't match,             
            response.redirect(`./login`);
        }
    }
});
app.listen(8080, () => console.log(`listening on port 8080`));