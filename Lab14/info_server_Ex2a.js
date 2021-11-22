var express = require('express');
var app = express();

app.use(express.urlencoded({ extended: true }));

//This is how routing works in express.  It goes down through the order of the following. 
//And ask do I match? If I match, it excutes the function.

app.post('/process_form', function (request, response) {
    response.send('in POST/test' + JSON.stringify(request.body));
});

app.all('*', function (request, response, next) {//* means anything
    console.log(request.method + ' to path ' + request.path + 'query string' + JSON.stringify(request.query));//what the request was to path
    next();//If i respond it's not gonna check any matches unless i do a next();
});

app.use(express.static('./public'));//anytime it gets GET request, it's going to go in to the public directory and look for the path you said.  

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback