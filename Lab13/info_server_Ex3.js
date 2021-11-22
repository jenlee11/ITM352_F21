var express = require('express');
var app = express();

app.use(express.urlencoded({ extended: true }));

//This is how routing works in express.  It goes down through the order of the following. 
//And ask do I match? If I match, it excutes the function.

app.post('/process_form', function (request, response, next) {
    //request.body is gonna have the data from POST
    var q = request.body['quantity_textbox'/*name of the textbox*/]; //get the value and put it in q
    if (typeof q != 'undefined') { 
        // if idon't have value it's not gonna respose 
    if(isNonNegInt(q)){
        response.send(`Thank you for purchasing ${q} things!`);
    } else {
        response.send(`Errors: ${q} is not a quantity. Hit the back button to fix.`)
    }
    } else {
        response.send(`Hey! You need to pick some stuff!`)
    }
    next();
});

app.all('*', function (request, response, next) {//* means anything
    console.log(request.method + ' to path ' + request.path + 'query string' + JSON.stringify(request.query));//what the request was to path
    next();//If i respond it's not gonna check any matches unless i do a next();
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
        if (parseInt(q) != q) errors.push('Not an integer!'); // Check that if it is an integer
    };

    return returnErrors ? errors : (errors.length == 0);
}
// if retunErrors is TRUE, it tells us what the errors are in the array.