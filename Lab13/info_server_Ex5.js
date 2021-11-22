var express = require('express');
var app = express();

app.all('*', function (request, response, next) {//* means anything
    console.log(request.method + ' to path ' + request.path + 'query string' + JSON.stringify(request.query));//what the request was to path
    next();//If i respond it's not gonna check any matches unless i do a next();
});

//share the data between different pages
app.use(express.urlencoded({ extended: true }));

var products = require('./product_data.json');
products.forEach((prod, i) => { prod.total_sold = 0 });
//this is gonna add total_sold to each products.

//.get("/product_data.js") is gonna reponse by giving me JavaScript
app.get("/product_data.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products = ${JSON.stringify(products)};`;
    response.send(products_str);
});

//This is how routing works in express.  It goes down through the order of the following. 
//And ask do I match? If I match, it excutes the function.

app.post('/process_form', function (request, response, next) {
    let brand = products[0]['brand'];
    let brand_price = products[0]['price'];

    console.log(request.body);
    var q = request.body['quantity_textbox'];//get the  value
    if (typeof q != 'undefined') {
        // if idon't have value it's not gonna respose 
        if (isNonNegInt(q)) {
            products[0].total_sold += Number(q);
            response.redirect('./order_page.html?quantity='+q);
        } else {
            response.redirect('./order_page.html?error=Invalid%20Quantity&quantity_textbox=' + q);
        }
    } else {
        response.send(`Hey! You need to pick some stuff!`)
    }
    next();
});



app.use(express.static('./public'));//anytime it gets GET request, it's going to go in to the public directory and look for the path you said.  

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback

function isNonNegInt(q, returnErrors = false) {
    // Check if a string q is a non-neg integer.  If returnRrros is true, the arrayif errors is returned.  
    // Otrhes returns true if q is a non-neg int.
    errors = [];
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    else {
        if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
        if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    };

    return returnErrors ? errors : (errors.length == 0);
}