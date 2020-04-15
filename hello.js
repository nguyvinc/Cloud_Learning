var fs = require('fs');
var circle = require('./circle');
var figlet = require('figlet');

console.log("Hello world.");
console.log("PORT:", process.env.PORT);
console.log("The circumference of a circle with radius 3 is: ", circle.circumference(3));
console.log("The area of a circle with radius 3 is: ", circle.area(3));
figlet("Hello world!", function(err, data){
    if (!err) {
        console.log(data);
    }
});
