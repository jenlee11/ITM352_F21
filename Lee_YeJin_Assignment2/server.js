/*
Ye Jin Lee
Run this server to check.
it checks quantities available, send to invoice.
most of my codes are borrowed from other labs, WODs, and website (css).
*/

var express = require('express');
var app = express();
var products = require('./products.json');
var fs = require('fs');
//get login data from user_data.json
var filename = './user_data.json';


//Lab14 Ex4
if (fs.existsSync(filename)) {
   // have reg data file, so read data and parse into user_data_obj
   var file_stats = fs.statSync(filename); //return information about the given file path
   var data = fs.readFileSync(filename, 'utf-8'); // read the file and return its content.
   var user_data = JSON.parse(data);
   console.log(`${filename} has ${file_stats.size} characters`);
} else {
   console.log(filename + ' does not exist!');
}

// It goes down through the order of the following. If matched, it excutes the function.

// monitor all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// decode form data in POST requests
app.use(express.urlencoded({ "extended": true }));

// Registration

app.post("/register", function (request, response) {
   // validate registration data
   var errors = {}; // assume no errors
   username = request.body.username.toLowerCase();
   fullname = request.body.name;

   // check is username is taken
   if (typeof user_data[username] != 'undefined') {
      errors['username_taken'] = `Sorry, ${username} is taken. Please select another.`;
   }
   
   // check if username has 4-10 characters. only letters and numebers.
   if (typeof user_data[username.length] < 10 || typeof user_data[username.length] > 4) {
      errors['username'] = 'Your username has to be 4 - 10 characters';// if enter invalid length, put wrong
   }

   //username contains only letters and numbers. show error message if entered other than numbers and letters
   if (/^[0-9a-zA-Z]+$/.test(typeof user_data[username])) {
   }
   else {
      errors['username'] = 'Username allowed only Letters and Numbers (Ex. jenjen1)';
   }
   // check fullname
   if (/^[A-Za-z, ]+$/.test(typeof user_data[fullname]) == false) {
      errors['name'] = 'Please enter YOUR FULL NAME here';
   }
   // check email
   if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(request.body.email) == false) {
      errors['email'] = 'Please use a valid email (Ex: name@email.com)';
   }

   // check password
   if (request.body.password.length < 6) {
      errors['password'] = 'You need to have a minimum of 6 characters'
   }

   // check pw-repeat
   if (request.body.password != request.body.repeat_password) {
      errors['pw_repeat'] = `Repeat password is not the same as password you typed above`;
   }








   let params = new URLSearchParams(request.query);

   // write registation data if no errors 
   if (Object.keys(errors).length == 0) {
      user_data[username] = {};
      user_data[username].password = request.body.password;
      user_data[username].email = request.body.email;

      fs.writeFileSync('./user_data.json', JSON.stringify(user_reg_data));

      params.append('username', username);
      response.redirect('./invoice.html?' + params.toString());
   } else {
      // put reg data in params
      params.append('reg_data', JSON.stringify(request.body));
      // put errors in params
      params.append('errors', JSON.stringify(errors));
      response.redirect('./register.html?' + params.toString());
   }
});

// Login

app.post("/login.html", function (request, response) {
   let params = new URLSearchParams(request.query);

   // Process login form POST and redirect to logged in page if ok, back to login page if not 
   let login_username = request.body['username'].toLowerCase();
   let login_password = request.body['password'];
   // check if username exeist, then check password entered match password stored
   if (typeof user_data[login_username] != 'undefined') {
      // take "password" and check if the password in the textbox is right
      if (user_data[login_username]["password"] == login_password) {
         // if username and pw matches then redirect to invoice.html
         params.append('username', login_username);
         response.redirect(`./invoice.html?` + params.toString());
         return;
      } else {
         // if the password doesn't match,   
         params.append(`error`, 'password not correct');
         response.redirect(`./login.html?` + params.toString());
      }
   } //if username is not found, send em back to login.html
   else {
      params.append(`error`, 'username not found');
      response.redirect(`./login.html?` + params.toString());
   }
});

// if client askes to load products.js, respond with JavaScript of the products array. This 
// enables dynamic sharing of product data including inventory amounts
app.get("/products.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products = ${JSON.stringify(products)};`;
   response.send(products_str);
});

// process purchase request (validate quantities, check quantity available)

app.post("/purchase", function (request, response) {
   // validate the quantities wanted
   var errors = {}; // assume no errors
   let has_quantities = false;
   for (i in products) {
      let q = request.body[`quantity${i}`];
      // Check is quantity is non-neg integer
      console.log(q, q > 0);
      if (isNonNegInt(q) == false) {
         errors['not_quantity' + i] = `${q} is not a valid quantity for  ${products[i].model}.`;
      }

      // check if customer wants to order more than inventory that we have
      if (q > products[i].quantity_available) {
         errors['not_available' + i] = `We don't have enough ${products[i].model}. Please select less than ${products[i].quantity_available}`;
      }
      // check if q > 0, if so, note that user selected some quantities
      if (q > 0) {
         has_quantities = true;
      }
   }
   // if has_quantities is false, generate an error
   if (has_quantities == false) {
      errors['no_quantities'] = "You need to select some items";
   }

   // create querystring from request.body (which has the quantity data)
   let params = new URLSearchParams(request.body);

   // send user back to products_display.html with error messages if error
   if (Object.keys(errors).length == 0) {
      // keep track of inventory. subtract purchased qtt from availability
      for (i in products) {
         products[i].quantity_available -= Number(request.body[`quantity${i}`]);
      }
      console.log(products);
      response.redirect('./login.html?' + params.toString());
   }
   else { // oops, had errors, so redirect back to productss_display.html wioth the errors
      // generate a string of all error messages
      let err_str = '';
      for (err in errors) {
         err_str += errors[err] + '\n';
      }
      params.append('err_msg', err_str);
      response.redirect('./products_display.html?' + params.toString());
   }
});

// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));

function isNonNegInt(q, returnErrors = false) {
   var errors = [];
   //check if string is a number value
   if (Number(q) != q) errors.push('Not a number!');

   // Check if it is non-negative
   if (q < 0) errors.push('Negative value!');

   // Check that it is an integer
   if (parseInt(q) != q) errors.push('Not an integer!');

   return returnErrors ? errors : ((errors.length > 0) ? false : true);
}