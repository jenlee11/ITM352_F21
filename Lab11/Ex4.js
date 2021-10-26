function isNonNegInt (q) {
    errors = []; //assume no errors at first
    if (Number(q) !=q) errors.push('Not a number!'); //check if string is a number value
    if (q < 0) erros.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) erros.push('Not an integer!'); // Check that it is an integer
    
    return (errors.length == 0)
}