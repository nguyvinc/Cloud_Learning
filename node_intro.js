const express = require("express");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const app = express();
const port = process.env.PORT || 8000;

const lodgingData = require("./lodging-data.json");
console.log("== Lodging data:", lodgingData);

app.listen(port, function(){
    console.log("== Server is listening on port ", port);
});

/*
 * Middleware functions
 */
app.get("/", function(res, req, next){
    console.log("== Got a request");
    res.status(200).send("Hello world");
});

app.get("/lodgings", function(res, req, next){
    res.status(200).send({
        lodgings: lodgingData
    });
});

app.post("/lodgings", function(req, res, next){
    console.log(req.body);
    if(req.body && req.body.name && req.body.description && req.body.price){
        lodgingData.push(req.body);
        req.status(201).send({  //Send id of new entry
            id: lodgingData.length-1
        });
    }
    else{
        res.status(400).send({
            err: "Request doesn't have required fields"
        });
    }
});

/*
 * /lodgings/5
 * /lodgings/{id}
 */
app.get("/lodgings/:id", function(req, res, next){
    console.log("== req.params:", req.params);
    const id = req.params.id;
    if(lodgingData[id]){
        res.status(200).send(lodgingData[id]);
    }
    else{
        next(); //Call next express middleware, which is 404 not found
    }
});

app.use("*", function(req, res, next){
    res.status(404).send({
        err: "${req.url} doesn't exist"
    });
});