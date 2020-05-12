const redis = require("redis");
const {checkAuthentication} = require("../models/users");
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT || "6379";
const redisClient = redis.createClient(redisPort, redisHost);

const RLWindowTime = 60000;
const RLWindowMax = 5;
const RLWindowAuthorizedMax = 10;

async function rateLimit(req, res, next){
    try{
        const tokenBucket = await getUserTokenBucket(req.ip);   //Get user's token bucket
        const timestamp = Date.now();                           //Get current timestamp
        const elapsedTime = timestamp - tokenBucket.last;       //Calculate elapsed time since last request

        //Check if the user is authenticated and determine the token refresh rate
        const authenticated = checkAuthentication(req.get("Authorization"));
        const refreshRate = (authenticated) ? (RLWindowAuthorizedMax / RLWindowTime) : (RLWindowMax / RLWindowTime);

        //Refresh the user's token and update the token bucket's timestamp
        tokenBucket.tokens += elapsedTime * refreshRate;
        tokenBucket.tokens = (authenticated) ? Math.min(RLWindowAuthorizedMax, tokenBucket.tokens) : Math.min(RLWindowMax, tokenBucket.tokens)
        tokenBucket.last = timestamp;

        //Check if user can afford to make the request
        if(tokenBucket.tokens >= 1){
            tokenBucket.tokens -= 1;
            await saveUserTokenBucket(req.ip, tokenBucket);
            next();
        }
        else{
            await saveUserTokenBucket(req.ip, tokenBucket);
            res.status(429).send({
                error: "Too many requests per minute."
            });
        }
    }
    catch(err){
        next();
    }
}

function getUserTokenBucket(ip){
    return new Promise((resolve, reject) => {
        redisClient.hgetall(ip, function(err, tokenBucket){
            if(err){
                reject(err);
            }
            else{
                if(tokenBucket){
                    tokenBucket.tokens = parseFloat(tokenBucket.tokens);
                }
                else{
                    tokenBucket = {
                        tokens: RLWindowMax,
                        last: Date.now()
                    };
                }
                resolve(tokenBucket);
            }
        });
    });
}

function saveUserTokenBucket(ip, tokenBucket){
    return new Promise((resolve, reject) => {
        redisClient.hmset(ip, tokenBucket, function(err, resp){
            if(err){
                reject(err);
            }
            else{
                resolve();
            }
        });
    });
}

exports.rateLimit = rateLimit;