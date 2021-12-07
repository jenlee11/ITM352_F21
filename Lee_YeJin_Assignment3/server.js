/*
Ye Jin Lee
Run this server to check.
it checks quantities available, send to invoice.
most of my codes are borrowed from other labs, WODs, and website (css).
*/

var express = require('express');
var app = express();
var myParser = require("body-parser");
var session = require('express-session');
var products = require('./products.json');
var fs = require('fs');

//get login data from user_data.json
var filename = './user_data.json';

app.use(myParser.urlencoded({ extended: true }));
app.use(session({secret: "ITM352 rocks!",resave: false, saveUninitialized: true}));
//borrowed code from example
app.all('*', function (request, response, next) {
   // need to initialize an object to store the cart in the session. We do it when there is any request so that we don't have to check it exists
   // anytime it's used
   if (typeof request.session.cart == 'undefined') { request.session.cart = {}; }
   request.session.save();
   next();
 });
 
 app.get("/get_products_data", function (request, response) {
   response.json(products_data);
 });
 
 app.get("/add_to_cart", function (request, response) {
   var products_key = request.query['products_key']; // get the product key sent from the form post
   var quantities = request.query['quantities'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
   request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
   response.redirect('./cart.html');
 });
 
 app.get("/get_cart", function (request, response) {
   response.json(request.session.cart);
 });
 
 app.get("/checkout", function (request, response) {
   var user_email = request.query.email; // email address in querystring
 // Generate HTML invoice string
   var invoice_str = `Thank you for your order ${user_email}!<table border><th>Quantity</th><th>Item</th>`;
   var shopping_cart = request.session.cart;
   for(product_key in products_data) {
     for(i=0; i<products_data[product_key].length; i++) {
         if(typeof shopping_cart[product_key] == 'undefined') continue;
         qty = shopping_cart[product_key][i];
         if(qty > 0) {
           invoice_str += `<tr><td>${qty}</td><td>${products_data[product_key][i].name}</td><tr>`;
         }
     }
 }
   invoice_str += '</table>';
 // Set up mail server. Only will work on UH Network due to security restrictions
   var transporter = nodemailer.createTransport({
     host: "mail.hawaii.edu",
     port: 25,
     secure: false, // use TLS
     tls: {
       // do not fail on invalid certs
       rejectUnauthorized: false
     }
   });
 
   var mailOptions = {
     from: 'phoney_store@bogus.com',
     to: user_email,
     subject: 'Your phoney invoice',
     html: invoice_str
   };
 
   transporter.sendMail(mailOptions, function(error, info){
     if (error) {
       invoice_str += '<br>There was an error and your invoice could not be emailed :(';
     } else {
       invoice_str += `<br>Your invoice was mailed to ${user_email}`;
     }
     response.send(invoice_str);
   });
  
 });

// decode form data in POST requests
app.use(express.urlencoded({ "extended": true }));

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

// Registration

app.post("/register", function (request, response) {
   // validate registration data
   var errors = {}; // assume no errors
   var reg_data ={};
   username = request.body.username.toLowerCase();


   // check is username is taken
   if (typeof user_data[username] != 'undefined') {
      errors['username'] = `Sorry, ${username} is taken. Please select another.`;
   }
   
     //username contains only letters and numbers. show error message if entered other than numbers and letters
   if (/^[0-9a-zA-Z]{4,10}$/.test(request.body.username) ==false) {
        errors['username'] = 'Your username has to be only letters and numbers with 4 - 10 characters (Ex. jenjen1)';
   }
   // check fullname
   if (/^[A-Za-z, ]+$/.test(request.body.fullname) == false) {
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
   if (request.body.password != request.body.repeatpassword) {
      errors['repeatpassword'] = `Repeat password is not the same as password you typed above`;
   }








   let params = new URLSearchParams(request.query);

   // write registation data if no errors 
   if (Object.keys(errors).length == 0) {
      user_data[username] = {};
      user_data[username].password = request.body.password;
      user_data[username].email = request.body.email;

      fs.writeFileSync('./user_data.json', JSON.stringify(reg_data));

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

app.post("/purchase", function (request, response, next) {
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

function isNonNegInt(q, returnErrors = false) {
   var errors = [];
   if (q == '') q = 0; // accept blank inputs as 0 selected
   //check if string is a number value
   if (Number(q) != q) errors.push('Not a number!');

   // Check if it is non-negative
   if (q < 0) errors.push('Negative value!');

   // Check that it is an integer
   if (parseInt(q) != q) errors.push('Not an integer!');

   return returnErrors ? errors : ((errors.length > 0) ? false : true);
}


// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));
