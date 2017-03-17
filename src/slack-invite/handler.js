'use strict';

//Send invtie to Slack Admin API
var sendInvite = (eventData, configData, callback) => { 
    
    let querystring = require('querystring');
    let https = require('https');
    let epochTime = Math.floor(new Date() / 1000);
    let slackTeamURL = configData.team+".slack.com";

    //Build querystring 
    
    let slackPOST = querystring.stringify({ 
        email:eventData.email,
        channels:configData.channels,
        token:configData.token,
        set_active:true,
        _attempts:1
    });
    
    //build full HTML POST request
    
    let post_options = {
        host: slackTeamURL,
        port: 443,
        path: "/api/users.admin.invite",
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(slackPOST)
        }
    };
    
    //Send request to Slack Admin API
    
    var post_req = https.request(post_options, res => {
        res.setEncoding('utf8');
        let respData = '';
        
        res.on('data', chunk => {
            respData += chunk;
        });
        
        res.on('end', ()=>{
            let respJSON = JSON.parse (respData);
            console.log("Ok: "+ respJSON.ok);
            if (respJSON.ok) {
                callback(null, "Invite Sent");
            } else {
                callback(respData.error);
            }
        });
    });

    post_req.write(slackPOST);
    post_req.end();

};

module.exports.invite = (event, context, callback) => {
  
  console.log("Invite Invoked");
  
  //Validation
    if (process.env.hasOwnProperty('token') &&
       process.env.hasOwnProperty('team')  &&
       process.env.hasOwnProperty('channels')) 
       {
           
          console.log ("Token, team and channels specified");
          
          let configJSON = {
            token: process.env.token,
            team: process.env.team,
            channels: process.env.channels.replace(" ",",")  //cannot have ',' in environment variables, use space ' ' instead, replace with , for processing
          };
          
          //Send Invite if all environment variables exist
          sendInvite(event, configJSON, err => {
              if (err) {
                  console.log ("Unable to send invite with error: " + err),
                  callback = ("Unable to send invite with error: " + err);
              } else {
                  console.log ("Function executed successfully");
                  callback = (null, "Invite sent successfully");
              }
          });
          
        } else {
            console.log("Variables not found");
            callback = ("Environment variables not available. Invite not sent.");
        }
};