'use strict';

//Validate reCaptcha by calling the reCaptcha API

var validatereCaptcha = (configData, callback) => { 
    
    let querystring = require('querystring');
    let https = require('https');
    
    //Build querystring
    let recaptchaPOST = querystring.stringify({ 
        secret:configData.recaptcha,
        response:configData.response
    });
    
    //Build full POST request
    var post_options = {
        host: 'www.google.com',
        port: 443,
        path: "/recaptcha/api/siteverify",
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(recaptchaPOST)
        }
    };
    
    //POST query to reCaptcha API
    var post_req = https.request(post_options, (res) => {
        res.setEncoding('utf8');
        let response_data = '';
        res.on('data', chunk => {
            response_data += chunk;
            });
            
        res.on('end', () => {
            
            let dataJSON = JSON.parse(response_data);
            let success = dataJSON.success;
            
            console.log ("Validation Result: " + success);
            
            if (success) {
                console.log ("Validation Succeeded"),
                callback(null, "Validation Result: " + success);
            } else {
                callback ("reCaptcha validation failed");
            }
        });
    });

    post_req.write(recaptchaPOST);
    
    post_req.on("error", (err) => {
        callback(err);
    });
    
    post_req.end();

};

module.exports.recaptcha = (event, context, callback) => {
  
  //Validate environment variable exists, and token recieved from API
  if (process.env.hasOwnProperty('RECAPTCHA') && event.hasOwnProperty('authorizationToken')) 
     {
        let configJSON = {
          recaptcha: process.env.RECAPTCHA,
          response: event['authorizationToken']
        };
        
        //Send data for validation with Google reCaptcha service
        validatereCaptcha(configJSON, (err, resp) => {
            if (err) {
                  console.log ("Unable to validate reCaptcha with error: " + err);
                  
                  let policy = {
                      principalId: 'recaptcha-authorizer',
                      policyDocument: {
                          Version: '2012-10-17',
                          Statement: {
                              Action: 'execute-api:Invoke',
                              Effect: 'Deny',
                              Resource: event.methodArn
                          }
                      }
                  };
  
                  console.log ("Authorization denied. Policy Document created: " + JSON.stringify(policy));
                  callback(null, policy);
            } else {
                  console.log (resp);
  
                  let policy = {
                      principalId: 'recaptcha-authorizer',
                      policyDocument: {
                          Version: '2012-10-17',
                          Statement: {
                              Action: 'execute-api:Invoke',
                              Effect: 'Allow',
                              Resource: event.methodArn
                          }
                      }
                  };
  
                  console.log ("Policy Document created: " + JSON.stringify(policy));
                  callback(null, policy);
            }
        });
      } else {
        console.log("Missing configuration data \n" + "reCaptcha Key Available: " + process.env.hasOwnProperty('RECAPTCHA') + "\n" + "reCaptcha Response Available: " + event.hasOwnProperty('authorizationToken'));
        callback = ("Unauthorized");
      }
};
