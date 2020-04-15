const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const port = process.env.PORT || 8000;

const lodgingData = require("./lodging-data.json");
console.log("== Lodging data: ", lodgingData);

app.listen(port, function(){
    console.log("== Server is listening on port ", port);
});

/*
 *  Middleware Functions
 */