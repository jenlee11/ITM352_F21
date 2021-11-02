
function isNonNegInt(q) {
    // q is a callback fun
    errors = []; //assume no errors at first. If returnErrors is true, the array of errors is returned,
    //others returns true if q is a non-neg int.
    errors = []; //assume no errors at first 
    if (Number(q) !=q) errors.push('Not a number!'); //check if string is a number value
    if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    
    // callback(errors);
    return (errors.length == 0);
}

(item, index) => {
    console.log(`part ${index} is ${(isNonNegInt(item)?'a':'not a')} quantity`);
}

attributes  =  "Jen; 31; 31.5; -30.5" ;
pieces = attributes.split(';');

pieces.forEach(
    (item, index) => {
        console.log(`part ${index} is ${(isNonNegInt(item)?'a':'not a')} quantity`);}
        );
    
