var fs = require('fs');
var express = require('express');
var app = express();


var filename = './registration_data.json';

if (fs.existsSync(filename)) {
    var stats = fs.statSync(filename);
    console.log(filename + 'has' + stats["size"] + 'characters');
    // have reg data file, so read data and parse into user_registration_info object
    
    var user_registration_info = require(filename);
    console.log(user_registration_info);
}
else {
    console.log(filename + 'does not exist!');
}

app.use(express.urlencoded({ extended: true }));

app.get("/login", function (request, response) {
    // Give a simple login form will be useful for the assignment 2
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

app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    let data_str = fs.readFileSync(filename, 'utf-8');
    var user_registration_info = JSON.parse(data_str);
    
//check if username exists
let login_username = request.body['username'];
let login_password = request.body["password"];
    

if (typeof user_registration_info [login_username] != 'undefined') {
    if (user_registration_info[login_username]["password"] == login_password) {
        response.send(`${login_username} is loged in`);
    } else {
        response.redirect(`./login?err=incorrect password for ${login_username}`);
    }
} else {
    response.send(`${login_username} does not exist`);
}

response.send('processing login' + JSON.stringify(request.body))
});

app.listen(8080, () => console.log(`listening on port 8080`));