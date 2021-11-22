

var express = require('express');
var app = express();

app.use(express.urlencoded({ extended: true }));


//route directly handles it
app.post('/process_form', function (request, response, next) {
    response.send('in POST/test' + JSON.stringify(request.body));
}); // req body has a data in a raw form.

// it executes the function. order matters.

app.all('*', function (request, response, next) { // * = all
    console.log(request.method + ' to path ' + request.path + 'query string' + JSON.stringify(request.query));
    next();
    //next(); next thing in the chain. will allow me to give response; 
});



app.get('/test', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + 'query string' + JSON.stringify(request.query));
    next();
});


app.use(express.static('./public')); //replaces http server .
// middleware component. GET request will look for the path public

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback