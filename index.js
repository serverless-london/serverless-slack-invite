var AWS = require('aws-sdk');
var s3 = AWS.S3;
var fs = require('fs');

var createPublishBucket = (bucketParams, websiteParams, callback) => {

    s3.createBucket (bucketParams, (bucketErr,bucketData)=>{
        if (bucketErr) {
            callback("Unable to create bucket with error: "+bucketErr);
        } else {
            
            let bucketName = bucketData.Location;
            console.log ("S3 bucket created at: "+bucketName);
            
            pushFilesS3("./upload/",bucketName, (err,data) => {
                if (err) {
                    callback("Unable to push files to S3 with error: "+err);
                } else {
                    
                    s3.putBucketWebsite(websiteParams, (websiteErr,websiteData) => {
                        if (websiteErr) {
                            callback("Unable to set website configuration for S3 bucket with error: "+websiteErr);
                        } else {
                            
                            let responseData = {
                                bucket: bucketData,
                                website: websiteData
                            };
                            console.log ("S3 configured for website publishing with URL: "+websiteData);
                            callback (null, responseData);
                        }
                    });
                }
            });
        }
    });
    
};

var updateFormURL = (urlName, callback) => {
    
    fs.readFile('index.html', 'utf8', (err,data) => {
    if (err) {
        console.log('Unable to find index.html with error: '+err);
        callback (err);
     } else {
         
        let result = data.replace(/replace me please/g, urlName);

        fs.writeFile('upload/index.html', result, 'utf8', function (err) {
            if (err) {
                console.log ('Unable to write new index.html with error: '+err);
                callback (err);
            } else {
                callback (null, "URL replace successfully");
            }
        });
     }
    });
};

var pushFilesS3 = (uploadDir, bucketName, callback) => {
    
    fs.readdir(uploadDir, 'utf8', (err,files) => {
        
        if (err) {
            console.log("Unable to read Upload directory with error: " +err);
            callback (err);
        } else {
            let uploadSuccess = true;
            
            let arrayLength = files.length;
            
            for (let i = 0; i < arrayLength; i++) {
                
                fs.readfile(uploadDir+files[i], 'buffer', (err,filebuffer) => {
                    if (err) {
                        uploadSuccess = false;
                        console.log("Unable to read "+files[i]+" with error: "+err);
                        callback(err);
                    } else {
                        s3.putObject({
                            Bucket: bucketName,
                            Key: files[i],
                            ACL: 'public-read',
                            Body: filebuffer
                        }, (err,data)=>{
                            if (err) {
                                uploadSuccess = false;
                                console.log("Unable to upload "+files[i]+" with error: "+err);
                                callback(err);
                            } else {
                                console.log(files[i]+" uploaded to S3 bucket "+ bucketName);
                            }
                        });
                    }
                });
                
                if (i===arrayLength & uploadSuccess) {
                    callback(null,"Upload successul");
                }
            }
        }
    });
};

var updateDeployFunctions = (functionNames, callback) => {
    
    if (functionNames.isArray) {
    
        const childSpawn = require ('child_process').spawn;
        const arrayLength = functionNames.length;
        let spawnSuccess = true;
        
        for (let i = 0; i < arrayLength; i++) {
            
            let deployOptions = {
                    cwd: './'+functionNames[i]+'/'
                };
                
            let spawnData = '';
    
            let spawnServerless = childSpawn('serverless',['deploy'], deployOptions); 
            
            spawnServerless.stdout.on('data', (data) => {
              console.log(`stdout: ${data}`);
              spawnData += data; 
            });
            
            spawnServerless.stderr.on('data', (data) => {
              console.log(`stderr: ${data}`);
              spawnSuccess = false;
              callback (data);
            });
            
            spawnServerless.on('close', (code) => {
              console.log(`child process exited with code ${code}`);
              if (code != 0) {
                spawnSuccess = false;
                callback (code);
              }
            });
            
            if (i == arrayLength & spawnSuccess) {
                callback(null, "Functions deployed successfully");
            }
        }     

 //   childExec.execSync('serverless deploy',{options: { cwd: './google-recaptcha/' } });
 //   childExec.execSync('serverless deploy',{options: { cwd: './slack-invite/' } });
    }   
}