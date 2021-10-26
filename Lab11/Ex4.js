

var attributes = "1;2;-4;;5";

var parts = attributes.split(';');

/*
for(part of parts {
    console.log(`${part} isNonNegInt: ${isNonNegInt(part)}`);
}
*/



parts.forEach((item, index) => {console.log(`part ${index} is ${(isNonNegInt(item)?'a':'not a')} quantity`)};

function is_string_non_neg_int(q, returnErrors = false) {
    errors = []; //assume no errors at first. If returnErrors is true, the array of errors is returned,
    //others returns true if q is a non-neg int.
    errors = []; //assume no errors at first 
    if (Number(q) !=q) errors.push('Not a number!'); //check if string is a number value
    if (q < 0) erros.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) erros.push('Not an integer!'); // Check that it is an integer
    
    return returnErrors ? errors : (errors.length == 0)
}

