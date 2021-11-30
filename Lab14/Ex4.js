var fs = require('fs');
var express = require('express');
var app = express();
var myParser = require("body-parser");
//user info that stores in JSON file
var filename = './registration_data.json';

if (fs.existsSync(filename)) {
    // have reg data file, so read data and parse into user_data_obj
        var file_stats = fs.statSync(filename); //return information about the given file path
        var data = fs.readFileSync(filename, 'utf-8'); // read the file and return its content.
        var users_reg_data = JSON.parse(data);
        console.log(`${filename} has ${file_stats.size} characters`);
    } else {
        console.log(filename + ' does not exist!');
    }    


// recognize the incoming Request Object as strings or arrays
app.use(express.urlencoded({ extended: true }));


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