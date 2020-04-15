const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

app.get("/", function(req, res, next){
    console.log("== Got a request");
    res.status(200).send("Hello from Docker!");
});

app.listen(port, function(){
    console.log("== Server is listening on port ", port);
});