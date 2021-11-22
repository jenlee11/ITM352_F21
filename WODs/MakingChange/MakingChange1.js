var coins_input = ('Quarters: %d Dimes: %d Nickels: %d Pennies: %d');

quarters = dimes = nickels = pennies = 0;
coins_input = 73;

// Get the max number of quarters
Quarters = parseInt (amount%25);

// Get the max number of dimes from leftover amount
leftover = amount%25;
Dimes = int(leftover/10);

// Get the max number of nickles from leftvoer amount
leftover = amount%10;
nickels = int(leftover/5);

// What's left will be 0-4 pennies
leftover = amount%5;
Pennies = amount%5;

console.log(`We need ${quarters} quarters, ${dimes} dimes, ${nickles} nickels, and ${pennies} pennies.`);
