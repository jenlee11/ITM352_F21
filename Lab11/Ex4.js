function isNonNegInt(val, returnErrors=false) {
    errors = []; //assume no errors at first 
 if (Number(q) !=q) errors.push('Not a number!'); //check if string is a number value
 if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
 if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
   
 return returnErrors ? errors : ((errors.length > 0) ? false:true);
}
isNonNegInt("-1.34");
isNonNegInt("-1");