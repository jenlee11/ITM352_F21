
function isNonNegInt(q, callback = console.log) {
    // q is a callback fun
    errors = []; //assume no errors at first. If returnErrors is true, the array of errors is returned,
    //others returns true if q is a non-neg int.
    errors = []; //assume no errors at first 
    if (Number(q) !=q) errors.push('Not a number!'); //check if string is a number value
    if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    
    callback(errors);
    // return returnErrors ? errors : (errors.length == 0)
}
isNonNegInt("-1.34");
isNonNegInt("-1");