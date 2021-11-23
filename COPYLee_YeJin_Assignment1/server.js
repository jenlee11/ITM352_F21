var express = require('express');
var app = express();
var data = require('./public/products.js');
var products = data.prods;

// decode form data in POST requests
app.use(express.urlencoded({ "extended": true }));

// monitor all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// process purchase request (validate quantities, check quantity available)
/* your code here */

app.post("/purchase", function (request, response) {
   // validate the quantities wanted
   var errors = {}; // assume no errors
   let has_quantities = false;
   for (i in products) {
      let q = request.body[`quantity${i}`];
      // Check is quantity is non-neg integer
      if (isNonNegInt(q) == false ) {
         errors['not_quantity' + i] = `${q} is not a valid quantity for  ${products[i].model}.`;
      }
      
      // check if q is more than products[i]['quantity_available']
      if (q > products[i].quantity_available) {
         errors['not_available' + i] = `We don't have enough ${products[i].model}. Please select less than ${ products[i].quantity_available }`;
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


   
   //response JavaScript
   app.get("/products", function (request, response, next) {
       response.type('.js');
       var products_str = `var products = ${JSON.stringify(products)};`;
       response.send(products_str);
   });
   
   // It goes down through the order of the following. If matched, it excutes the function.
   
   app.post('/purchase', function (request, response, next) {
       let model = products[0]['model'];
       let model_price = products[0]['price'];
   
       console.log(request.body);
       var q = request.body['quantity_textbox'];//get the  value
       if (typeof q != 'undefined') {
           // no value no response 
           if (isNonNegInt(q)) {
               products[0].total_sold -= Number(q);
               response.redirect('./products_display.html?quantity=' -q);
           } else {
               response.redirect('./products_display.html?error=Invalid%20Quantity&quantity_textbox=' - q);
           }
       } else {
           response.send(`Hey! You need to pick some stuff!`)
       }
       next();
   });
   

   // create querystring from request.body
   var q_str = '';
   for (prop in request.body) {
      q_str += `${prop}=${request.body[prop]}&`;
   }
   // send user back to products_display.html with error messages if error
   if (Object.keys(errors).length == 0) {
      // keep track of inventory. subtract purchased qtt from availability
      for (i in products) {
         products[i].quantity_available -= Number(request.body[`quantity${i}`]);
      }
      console.log(products);
      response.redirect('./invoice.html?' + q_str);
   }
   else {
      // generate an alert with error messages
      let err_str = '';
      // Put all error messages into a string
      for (err in errors) {
         err_str += errors[err] + '\n';
      }
      response.redirect('./products_display.html?' + q_str + `err_msg=${err_str}`);
   }
});

// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));

function isNonNegInt(q, returnErrors=false) {
   var errors = [];
   //check if string is a number value
 if (Number(q) !=q) errors.push('Not a number!'); 

// Check if it is non-negative
 if (q < 0) errors.push('Negative value!'); 

 // Check that it is an integer
if (parseInt(q) != q) errors.push('Not an integer!'); 
  
return returnErrors ? errors : ((errors.length > 0) ? false:true);
}