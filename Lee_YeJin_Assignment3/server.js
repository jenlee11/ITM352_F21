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
var session = require('express-session');
const { stringify } = require('querystring'); // ???? what ???
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var nodemailer = require('nodemailer');


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
   console.log(request.method + ' to ' + request.path, request.body);
   next();
});

// decode form data in POST requests
app.use(express.urlencoded({ "extended": true }));
// start sessions


//tell session id to be encrypted so id can't be copied
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));


// Registration

app.post("/register", function (request, response) {
   // validate registration data
   var errors = {}; // assume no errors
   var reg_data = {};
   var loginMessage_str = ''; //login message

  var username = request.body['username'].toLowerCase();


   // check is username is taken
   if (typeof user_data[username] != 'undefined') {
      errors['username'] = `Sorry, ${username} is taken. Please select another.`;
   }

   //username contains only letters and numbers. show error message if entered other than numbers and letters
   if (/^[0-9a-zA-Z]{4,10}$/.test(request.body.username) == false) {
      errors['username'] = 'Your username has to be only letters and numbers with 4 - 10 characters (Ex. jenjen1)';
   }
   // check fullname
   if (/^[A-Za-z, ]+$/.test(request.body.fullname) == false) {
      errors['fullname'] = 'Please enter YOUR FULL NAME here';
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



   let params = new URLSearchParams(); // save quantity data to use in query string

   // write registation data if no errors 
   if (Object.keys(errors).length == 0) {
      // add new user to user_data
      user_data[username] = {};
      user_data[username].name = request.body.name;
      user_data[username].password = request.body.password;
      user_data[username].email = request.body.email;
      // write out updated user_data to user_data.json
      fs.writeFileSync('./user_data.json', JSON.stringify(user_data));
      var user_info = { "username": username, "name": user_data[username].name, "email": user_data[username].email };
      response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });
      response.redirect('./index.html');

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
   var login_username = request.body['username'].toLowerCase();
   var login_password = request.body['password'];
   // check if username exeist, then check password entered match password stored
   if (typeof user_data[login_username] != 'undefined') {
      // take "password" and check if the password in the textbox is right
      if (user_data[login_username].password == login_password) {

         //set a exp of 30 minutes.
         var user_info = { "username": login_username, "email": user_data[login_username].email, "name": user_data[login_username].name };
         response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });


         
         //send back to the products display page
         response.redirect('./index.html?' + stringify(request.query));
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

//send back to login page with errors

// if client askes to load products.js, respond with JavaScript of the products array. This 
// enables dynamic sharing of product data including inventory amounts
app.get("/products.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products = ${JSON.stringify(products)};`;
   response.send(products_str);
});


// Log Out
app.get("/logout", function (request, response, next) {
   var user_info = JSON.parse(request.cookies["user_info"]);
   var username = user_info["username"];
   logout_msg = `<script>alert('${user_info.name} has successfully logged out!'); location.href="./index.html";</script>`;
   response.clearCookie('user_info');
   response.send(logout_msg);
   request.session.destroy();
});



//Microservice to provide cart data for current session (fetch cart data)
app.post("/get_cart_data", function (request, response, next) {
   response.json(request.session.cart);
});



// process add to cart request (validate quantities, check quantity available)

app.post("/add_cart", function (request, response) {
   console.log(request.body);
   // validate the quantities wanted
   var errors = {}; // assume no errors
   let has_quantities = false;
   var prod_key = request.body["producttype"];

   for (i in products[prod_key]) {
      let q = request.body[`quantity${i}`];
      // Check is quantity is non-neg integer
      if (isNonNegInt(q) == false) {
         errors['not_quantity' + i] = `${q} is not a valid quantity for  ${products[prod_key][i].model}.`;
      }

      // check if customer wants to order more than inventory that we have
      if (q > products[prod_key][i].quantity_available) {
         errors['not_available' + i] = `We don't have enough ${products[prod_key][i].model}. Please select less than ${products[prod_key][i].quantity_available}`;
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

   // Add quantities to cart if no errors, send user back to products_display.html with error messages if error
   if (Object.keys(errors).length == 0) {
      // add quantities to cart (put into session)
      if (typeof request.session.cart == 'undefined') {
         request.session.cart = {};
      }
      if (typeof request.session.cart[prod_key] == 'undefined') {
         request.session.cart[prod_key] = [];
      }
      for (i in products[prod_key]) {
         request.session.cart[prod_key][i] = Number(request.body[`quantity${i}`]);
      }
      console.log(request.session.cart);
      response.redirect(`./cart.html`);
   }
   else {
      // oops, had errors, so redirect back to productss_display.html wioth the errors
      // generate a string of all error messages
      let err_str = '';
      for (err in errors) {
         err_str += errors[err] + '\n';
      }
      params.append('err_msg', err_str);
   }
   response.redirect('./products_display.html?' + params.toString());
});


//Update cart
app.post('/update_cart', function (request, response, next) {
   console.log(request.body);
   var updated_cart = request.body;
   var errors = {}; //start with no errors
   
   // borrowed from classmate
   //modify inventory from the difference of cart and update
   if (Object.keys(errors).length == 0) {
       //modify inventory from the difference of cart and update
       for (let prod_key in products) {

           // trying to fix the null error (thank you professor port)
           for (let i in products[prod_key]) {
               if (typeof updated_cart[`cart_${prod_key}_${i}`] == 'undefined') {
                   continue;
               }

               //get the difference between cart and inventory
               let diff = request.session.cart[prod_key][i] - updated_cart[`cart_${prod_key}_${i}`];
               products_array[product_key][i].quantity_available += diff;
               request.session.cart[prod_key][i] = Number(updated_cart[`cart_${prod_key}_${i}`]);
           }
       }
   }

   let params = new URLSearchParams();
   params.append('errors', JSON.stringify(errors));

   response.redirect(`./cart.html?${params.toString()}`);


});



// Complete_Purchase

// sets up mail server. Copy of Assignment example 3.
app.post('/Complete_Purchase', function (request, response, next) {
   // chek if logged in. If not, redirect to login
   if(typeof request.cookies["user_info"] == 'undefined') {
      response.redirect('./login.html');
   return;
   }
   var user_info = JSON.parse(request.cookies["user_info"]); //user_info into JSON
   var user_email = user_info["email"]; //save users' email

   //Generate HTML invoice table
   var invoice_str = ` <table border="2" table class="inventory">
   <thead>
     <tr>
     <th><span>Model</span></th>
     <th><span>Quantity</span></th>
     <th><span>Weight (lb)</span></th>
     <th><span>Extended weight</span></th>
     <th><span>Price</span></th>
     <th><span>Extended price</span></th>

   </tr>`;
   var shopping_cart = request.session.cart;
   for (prod_key in products) {
      for (i = 0; i < products[prod_key].length; i++) {
         if (typeof shopping_cart[prod_key] == 'undefined') continue;
         qty = shopping_cart[prod_key][i];
         if (qty > 0) {
            invoice_str += `<tr><td>${qty}</td><td>${products[prod_key][i].model}</td><tr>`;
         }
      }
   }
   invoice_str += '</table>';



   // sets up mail server. Copy of Assignment example 3.
   //only will work on UH network due to security restrictions
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
      from: 'yejinj@hawaii.edu',
      to: user_email,
      subject: `Thanks, ${user_info.name} For Purchasing from Jen's LG store`,
      html: invoice_str
   };
   transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
         invoice_str += '<br>There was an error and your invoice could not be emailed :('; //if invoice unable to send
       } else {
         invoice_str += `<br>Your invoice was mailed to ${user_data[username].email}`;
       }
       response.clearCookie('user_info'); //destroys cookie
       request.session.destroy(); //delete the session, once email is sent
       response.send(invoice_str);
    
     });

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