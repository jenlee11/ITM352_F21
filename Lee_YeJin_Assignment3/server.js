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
   var user_data = JSON.parse(fs.readFileSync(filename, 'utf-8'));
   } else {
   console.log(`${filename} does not exist!`);
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
   var loginMsg_str = ''; //welcome message

   var username = request.body['username'].toLowerCase();


   // check is username is taken
   if (typeof user_data[username] != 'undefined') {
      errors['username'] = `Sorry, ${username} is taken. Please select another.`;
   }

   //username contains only letters and numbers. show error message if entered other than numbers and letters
   if (/^[0-9a-zA-Z]{4,10}$/.test(request.body.username) == false) {
      errors['username'] = 'Your username has to be only letters and numbers with 4 - 10 characters (Ex. jenjen1)';
   }
   // check name
   if (/^[A-Za-z, ]+$/.test(request.body.name) == false) {
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


   let params = new URLSearchParams(); // save quantity data to use in query string

   // write registation data if no errors 
   if (Object.keys(errors).length == 0) {
      // add new user to user_data
      user_data[username] = {};
      user_data[username].name = request.body.name;
      user_data[username].password = request.body.password;
      user_data[username].email = request.body.email;

      //show welcom message when registered successfully
      loginMsg_str = `<script>alert('${user_data[username].name} Registered! Please login to proceed');
      location.href = "${'./login.html'}";
      </script>`;
      // write out updated user_data to user_data.json
      fs.writeFileSync('./user_data.json', JSON.stringify(user_data));
      var user_info = { "username": username, "name": user_data[username].name, "email": user_data[username].email };
      response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });
      response.send(loginMsg_str);
      response.redirect('./products_display.html');

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
   var username = request.body['username'].toLowerCase(); 
    var errors = {};
   var loginMsg_str = '';


   // check if username exeist, then check password entered match password stored
   if (typeof user_data[username] != 'undefined') {
      // take "password" and check if the password in the textbox is right
      if (user_data[username].password == request.body.password) {
  loginMsg_str = `<script>alert('${username} logged in!);
      location.href = "${'./products_display.html?prod_key=Kitchen'}";
      </script>`;
         //set a exp of 30 minutes.
         var user_info = { "username": username, "email": user_data[username].email, "name": user_data[username].name };
         response.cookie('user_info', JSON.stringify(user_info), { maxAge: 30 * 60 * 1000 });
         //message that displays after login
         response.send(loginMsg_str);
      
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
      var q = request.body[`quantity${i}`];
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
      // keep up inventory available removing purchased items
      products[prod_key][i].quantity_available -= Number(request.body[`quantity${i}`]);
            AddedItem_msg = `<script>alert('Your ${`prod_key${i}`} has been added in your cart!'); location.href="./products_display.html";</script>`;
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
      response.send(AddedItem_msg);
      response.redirect(`./products_display.html`);
      
      
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
   var updated_cart = request.body;
   var errors = {}; //start with no errors
   // check if inventory is available for update
   for (let pk in request.session.cart) {
      for (let i in request.session.cart[pk]) {
         if (typeof request.body[`update_quantity_${pk}_${i}`] != 'undefined') {
            // check if new quantity wanted is available
            let q_wanted = Number(request.body[`update_quantity_${pk}_${i}`]);
            if (q_wanted > products[pk][i].quantity_available) {
               errors[`unavailable_${pk}_${i}`] = `Sorry, ${q_wanted} ${products[pk][i].model} are not available anymore.`;
            }
         }
      }
   }


   //no errors so update cart in session
   if (Object.keys(errors).length == 0) {
      for (let pk in request.session.cart) {
         for (let i in request.session.cart[pk]) {
            if (typeof request.body[`update_quantity_${pk}_${i}`] != 'undefined') {
               // overwrite cart quantity with update cart quantity
               request.session.cart[pk][i] = Number(request.body[`update_quantity_${pk}_${i}`]);
            }
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
   if (typeof request.cookies["user_info"] == 'undefined') {
      response.redirect('./login.html');
      return;
   } else {
   var user_info = JSON.parse(request.cookies["user_info"]); //user_info into JSON
   var user_email = user_info["email"]; //save users' email

   //Generate HTML invoice table
   var invoice_str = ` <link rel="stylesheet" typa="text/css" href="./invoice-style.css">
    <header>
   <h1>Invoice</h1></header>
   
   <table border="2" table class="inventory">
   <h3> Thank you for your order ${user_info.name}!<br>
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
   subtotal = 0;
   total_weight =0;

   for (prod_key in products) {
      for (i = 0; i < products[prod_key].length; i++) {
         if (typeof shopping_cart[prod_key] == 'undefined') continue;
         qty = shopping_cart[prod_key][i];
       
         if (qty > 0) {

            // calculate the subtotals and total_weight and write extended_price and extended_weight
            extended_price = products[prod_key][i].price * qty;
            subtotal += extended_price;
            extended_weight = products[prod_key][i].weight * qty;
            total_weight += extended_weight;
         
      
   
   invoice_str += `<tr>
   <td width="43%">${products[prod_key][i].model}</td>
   <td align="center" width="10%"><input type="number" min=0 max=${products[prod_key][i].quantity_available} value="${qty}" name="update_quantity_${prod_key}_${i}" ></td>
   <td width="13%">${products[prod_key][i].weight}</td>
   <td width="13%">${extended_weight}</td>
   <td width="13%">\$${products[prod_key][i].price}</td>
   <td width="13%">\$${extended_price}</td>
   
   </tr>`;
}
      };
}

// Compute tax
var tax_rate = 0.0471;
var tax = subtotal * tax_rate;

// Compute shipping // change it to suitable for appliances *weight ..

if (total_weight == 0) {
   shipping = 0;
}
else if (total_weight <= 10) {
   shipping = 50;
}
else if (total_weight <= 500) {
    shipping = 200;
}
else {
    shipping = 300;
}

// Compute grand total
var total = subtotal + tax + shipping;

invoice_str +=` <article>
<table class="balance">
<tbody>
<tr>
    <td><span>Sub-total</span></td>
    <td><span>$${subtotal.toFixed(2)}</span></td>
</tr>
<tr>
    <td><span>Tax @ 4.71%</span>
    </td>
    <td><span>$${tax.toFixed(2)}</span></td>
</tr>
<tr>
    <td>Total weight</td>
    <td><span>${total_weight}lb</span></td>
</tr>
<tr>
    <td><span>Shipping</span></td>
    <td><span>$${shipping.toFixed(2)}</span></td>
    </tr>
<tr>
    <td><span><strong>Total</strong></span></td>
    <td><span><strong>$${total.toFixed(2)}</span></strong></td>
</tr></tbody>
</table> </article>


<aside>
<div>
    <p></p><br><br><br><p><br><br><br><br><br><br>
    <br><br><br>
    <h1><b>OUR SHIPPING POLICY IS:</b></h1>
    Weight under 10 lb will be $50 shipping<br>
    Weight 11 ~ 500 lb will be $200 shipping<br>
    Weight over 500 lb will be $300 shipping<br>
    </p>
</div>
</aside>
<br>

<br><br><a href="./index.html"> Continue Shopping! </a>
`;

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
         invoice_str += `<br>Your invoice was mailed to ${user_email}`;
      }
      response.clearCookie('user_info'); //destroys cookie
      request.session.destroy(); //delete the session, once email is sent
      response.send(invoice_str);

   });
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