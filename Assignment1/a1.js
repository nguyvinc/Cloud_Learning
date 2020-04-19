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
 * -Add Business
 * -Modify Business Info
 * -Remove Business
 * 
 * Users:
 * X-Get Business List
 * X-Get Single Business Info
 * -Submit Business Review
 * -Modify/Delete Business Review
 * -Upload Business Image
 * -Delete Business Photo
 * -Modify Business Photo Caption
 * -List Owned Businesses
 * -List All Written Reviews
 * -List All Uploaded Photos
 * 
*/
app.get("/businesses", function(req, res, next){
    console.log("== List Business Request", req.query);
    let page = 1;
    let total_page = Math.floor(businessList.length / 10) + 1;
    if(businessList.length % 10 === 0){
        total_page -= 1;
    }
    if(req.query.page){
        page = req.query.page;
        if(page > total_page){
            next();
        }
    }
    let nextPage = page + 1;
    let prevPage = page - 1;
    if(nextPage > total_page){
        nextPage = 1;
    }
    if(prevPage === 0){
        prevPage = total_page;
    }

    res.status(200).send({
        "page_number": page,
        "total_pages": total_page,
        "page_size": 10,
        "total_count": businessList.length,
        "businesses": businessList,
        "links": {
            "nextPage": "/businesses?page="+nextPage,
            "prevPage": "/businesses?page="+prevPage
        }
    });
});

app.get("/businesses/:id", function(req, res, next){
    console.log("== Single Business Request", req.params);
    let reqId = req.params.id;
    let found = false;
    businessList.forEach(function(data){
        if(data.id == reqId){
            found = true;
            res.status(200).send(data);
        }
    });
    if(!found){
        next();
    }
});

app.use("*", function(req, res, next){
    res.status(404).send({err: "The requested resource was not found."});
});