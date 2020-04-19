const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());

const port = process.env.PORT || 8000;

const businessList = require("./business-data.json");
//console.log("== Lodging data: ", lodgingData);

app.listen(port, function(){
    console.log("== Server is listening on port ", port);
});

/*
 *  Middleware Functions
*/


/* 
 * Middleware Functions Needed:
 * 
 * Business Owners:
 * X-Add Business
 * X-Modify Business Info
 * X-Remove Business
 * 
 * Users:
 * X-Get Business List
 * X-Get Single Business Info
 * -Submit Business Review
 * -Modify/Delete Business Review
 * -Upload Business Image
 * -Delete Business Photo
 * -Modify Business Photo Caption
 * X-List Owned Businesses
 * -List All Written Reviews
 * -List All Uploaded Photos
 * 
*/

// Get Business List
app.get("/businesses", function(req, res, next){
    console.log("== List Business Request", req.query);
    let page = 1;
    let totalPage = Math.floor(businessList.length / 10) + 1;  //Calculate total pages
    if(businessList.length % 10 === 0){ //If number of businesses divisible by 10, total pages reduced by 1
        totalPage -= 1;
    }
    if(req.query.page){         //If a page is specfied
        page = req.query.page;  //Set the page to grab
        if(page > totalPage || page < 0){  //If the page doesn't exist
            next();             //Go to 404 not found
        }
    }
    let nextPage = page + 1;    //Get the next page
    let prevPage = page - 1;    //Get the previous page
    if(nextPage > totalPage){  //If the next page is greater than the total pages, grab page 1
        nextPage = 1;
    }
    if(prevPage === 0){         //If the previous page is 0, grab the last page
        prevPage = totalPage;
    }

    res.status(200).send({      //Send the data
        "page_number": page,
        "total_pages": totalPage,
        "page_size": 10,
        "total_count": businessList.length,
        "businesses": businessList,
        "links": {
            "nextPage": "/businesses?page="+nextPage,
            "prevPage": "/businesses?page="+prevPage
        }
    });
});

// Add Business
app.post("/businesses", function(req, res, next){
    console.log("== Add Business Request", req.body);
    //Check for required fields
    if(req.body.name && req.body.address && req.body.city && req.body.state && req.body.zip && req.body.phone && req.body.category && req.body.subcategories && req.body.owner_id){
        let newBusiness = req.body;    //Grab the business info
        newBusiness.business_id = 1;            //Generate new business id
        businessList.forEach(function(business){    //Search through all businesses
            if(business.business_id >= newBusiness.business_id){     //Find highest current business id
                newBusiness.business_id = business.business_id + 1;  //Add 1 to current highest business id
            }
        });
        businessList.push(newBusiness);//Add business to the list
        res.status(201).send({
            "msg": "Business successfully added.",
            "newBusiness": newBusiness
        });
    }
    else{   //If any required fields are empty, send error
        req.status(400).send({
            err: "Request doesn't have the required fields."
        });
    }
});

// Get Single Business
app.get("/businesses/:bId", function(req, res, next){
    console.log("== Single Business Request", req.params);
    let reqId = req.params.bId;  //Get requested id
    let found = false;
    businessList.forEach((data) => {//Search through all businesses
        if(data.id == reqId){   //If business id matches requested id
            found = true;
            res.status(200).send(data); //Send business's data
        }
    });
    if(!found){ //If requested id was not found, go to 404
        next();
    }
});

// Modify Business
app.put("/businesses/:bId", function(req, res, next){
    console.log("== Modify Business Request", req.body);
    //Check for required fields
    if(req.body && req.body.name && req.body.address && req.body.city && req.body.state && req.body.zip && req.body.phone && req.body.category && req.body.subcategories){
        const reqId = req.params.bId;    //Get requested id
        let found = false;
        for(let i=0; i<businessList.length; i++){   //Search through all businesses
            if(businessList[i].id == reqId){//If business id matches requested id
                businessList[i] = req.body; //Modify the business
                found = true;
                res.status(200).send({
                    msg: "Business modified.",
                    input: businessList[i]
                });
                break;
            }
        }
        if(!found){ //If requested id was not found, go to 404
            next();
        }
    }
    else{   //If any required fields are empty, send error
        res.status(400).send({
            err: "Request doesn't have required fields."
        });
    }
    
});

// Delete Business
app.delete("/businesses/:bId", function(req, res, next){
    console.log("== Delete Business Request");
    const reqId = req.params.bId;    //Get requested id
    let found = false;
    for(let i=0; i<businessList.length; i++){   //Search through all businesses
        if(businessList[i].id == reqId){    //If business id matches requested id
            found = true;
            businessList.splice(i, 1);  // Remove the business
            res.status(200).send({
                msg: "Business deleted.",
                id: reqId
            });
            break;
        }
    }
    if(!found){ //If requested id was not found, go to 404
        next();
    }
});

// List Owned Businesses
app.get("/users/:uId/businesses", function(req, res, next){
    console.log("== List Owned Businesses Request UserID:", req.params.uId);
    const userId = req.params.uId;
    let ownedBusinesses = [];
    businessList.forEach((data) => {
        if(data.owner_id == userId){
            ownedBusinesses.push(data);
        }
    });
    res.status(200).send(ownedBusinesses);
});

// List All Written Reviews
app.get("/users/:uId/reviews", function(req, res, next){
    console.log("== List All Written Reviews UserID:", req.params.uId);
    const userId = req.params.uId;
    let reviews = [];
});

app.use("*", function(req, res, next){
    res.status(404).send({err: "The requested resource was not found."});
});