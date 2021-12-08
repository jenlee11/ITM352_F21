var coins = (`Quarters:%d Dimes:%d Nickles:%d Pennies:%d`);

amount = 173;

//Get the max amount of quarters
quarters = parseInt(amount/25);

//Get the max amount of dimes from leftover above
leftover = amount%25;
dimes = parseInt(leftover/10);

//Get the max amount of nickles leftover above
leftover = amount%10;
nickles = parseInt(leftover/5);

//what's leftover
pennies = amount%5;


console.log(`We need ${quarters} quarters, ${dimes} dimes, ${nickles} nickles, and ${pennies} pennies.`);