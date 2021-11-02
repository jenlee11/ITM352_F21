var month = 5;
var day = 7;
var year = 1990;

step1 = year - 1900;
step2 = parseInt(step1/4);
step3 = step1 + step2;
step4 = 1;
step6 = step4 + step3;
step7 = day + step6;
step8 = step7;
step9 = step8; // not a leap year
step10 = step9 %7;

console.log(step10);


