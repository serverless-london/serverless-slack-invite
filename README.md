# Serverless Slack Invite Service

Powered by the Serverless Framework and Amazon Web Services. A Zero Cost solution to inviting people to your Slack Team. 

Currently the installation method is a little manual, this will improve with time.

## Installation

There are a few steps that need to be done.

1) Install the Serverless Framework as per [https://serverless.com/framework/docs/providers/aws/guide/installation/](https://serverless.com/framework/docs/providers/aws/guide/installation/)
    * Complete the Installation and Credentials steps, then continue with these steps
    
2) Clone this repo
    ```
    git clone https://github.com/serverless-london/serverless-slack-invite.git
    ```

3) Get Slack Credentials
    * To invite someone to a Slack team three pieces of information are needed. Namely a Slack token, team name, and channels the user will join on accepting an invite.
    * Slack Token: You can retrieve the Slack token at [https://api.slack.com/custom-integrations/legacy-tokens](https://api.slack.com/custom-integrations/legacy-tokens) (you need to be an admin on the Slack team to get this token)
    * Slack Team: Just the team name, not the entire URL (i.e. 'serverless-forum' not serverless-forum.slack.com)
    * Slack Channels: The channel id is required, not the channel name. You can get the channel id's by querying the Slack API here [https://api.slack.com/methods/channels.list/test](https://api.slack.com/methods/channels.list/test) 
    
4) Update deployment files
    * Now that you have this detail, you need to update the deployment configuration file. In your cloned git repository go to `src/slack-invite` and edit `slack-invite.json`
    
    ``` 
    {
        "token":"SLACK TOKEN HERE",
        "team":"TEAM NAME HERE",
        "channels":"CHANNEL ID'S HERE WITH A SPACE BETWEEN EACH"
    } 
    ```
    
    * This JSON file is only needed at deployment time. After the function is deployed you can delete it. 
    * The values in the JSON file are written to environment variables used by the function, which can be edited post-deployment in the AWS Lambda console.
    * If specifying multiple channel ids, you must be delimit each channel id by a space not a comma, as a comma is an illegal character in an environment variable.

5) Deploy functions
    * This service has two discreet functions. One to validate the Google reCaptcha tokan, and another to post to the Slack API to send an invite. API Gateway is deployed to trigger the Slack Invite function, with the reCaptcha validation function configured as a custom authroizer function on the API Gateway endpoint.
    * The two functions are in two seperate serverless services. This was a conscious decision, as it enables you to use the functions for other things. You can use a Typeform as an interface for your Slack Invite and invoke the Slack Invite function via a Zapier integration; or you can re-use the reCaptcha validation function for any webform.
    * To deploy the two functions in the cloned github repo do the following
    
    ``` 
        cd src/google-recaptcha
        serverless deploy
        cd ../slack-invite
        serverless deploy
    ```
    
    * This should deploy your two functions and an API Gateway endpoint. 
    * Ensure you have installed the Serverless Framework correctly and provided AWS credentials with the recommended level of permissions as required by the Serverless Framework.
    * You can edit the `serverless.yml` files in each of the function folders to change the AWS region and other standard options
    * Take note of the API Gateway endpoint as you will need it in the next step.

6)  The sign up form
    * Included in the git repo is a simple web page template at `src/web`. It consists of three files, `index.html`, `404.html` and `formsubmit.js`
    * You can edit the look and feel of it however you want, but don't touch the javascript file used to submit the form.
    * It uses [Tachyons](http://tachyons.io/) as it's CSS framework. This isn't required, I just like Tachyons.
    * Before publishing the sign up form you will need to edit `index.html` to point to the API Gateway endpoint you've just configured
    * Search for 
        ```
        <form action="https://YOUR.API.ENDPOINT.HERE"
        ```
        in the file and replace the URL with the API Gateway endpoint that will trigger the Slack Invite function.
        
7)  Publish the sign up form
    * To publish the sign-up form you first need to configure an S3 bucket to host it. You can do that by following these instructions [http://docs.aws.amazon.com/AmazonS3/latest/user-guide/static-website-hosting.html](http://docs.aws.amazon.com/AmazonS3/latest/user-guide/static-website-hosting.html)
    * Once confifugred, upload the three files from `src/web` to your new bucket.

At this point if everything hasn't gone horribly wrong you should be able to navigate in your browser to the public S3 endpoint on your newly configured bucket and hopefully sign up to a Slack team!

## Notes

8) Setting up reCaptcha
    * This service uses Google's reCaptcha platform to limit spamming of invites. The repo you cloned already has the reCaptcha test keys configured, so if you just want to test for now you can skip this bit.
    * Go to [https://www.google.com/recaptcha/admin#list](https://www.google.com/recaptcha/admin#list) to setup your reCaptcha account.
    * Choose reCaptcha V2 as the reCaptcha type as I haven't tested this with the Invisible reCaptcha yet.
    * Once you've set it up, you should have two keys, a client key and a secret/private key.
    * To get the reCaptcha working you will need to do three things.
      * Setup a Custom Domain for your S3 bucket hosting the website [http://docs.aws.amazon.com/AmazonS3/latest/dev/website-hosting-custom-domain-walkthrough.html](http://docs.aws.amazon.com/AmazonS3/latest/dev/website-hosting-custom-domain-walkthrough.html)
      * Edit `index.html` and update the attribute `data-sitekey=` with the client key
      * Update the environment variable `recaptcha` for the function `google-recaptcha` with the secret key in the AWS Lamdba console.

9)  No reCaptcha    
    * If you don't want to use reCaptcha at all, just simply remove the following from `index.html`
      * Delete ``onload="disableBtn()"`` in the ``<body>`` tag
      * Delete the line ``<div class="g-recaptcha" data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" data-callback="enableBtn"></div>`` 
    * Go to API Gateway, and remove the Custom Authorizer from the API Endpoint.

10) Invitation Limits
    * A number of Slack teams have hit [Inivitation Limits](https://get.slack.help/hc/en-us/articles/201330256-Invite-new-members-to-your-Slack-team#invitation-limits) by using these self-invite services. You can get the limit lifted quite easily by creating a ticket with Slack. It's just something to look out for.

# TODO
1) Automate deployment of service
2) Write tests :-/ !!!!!
3) Improve documentation!
4) Better reporting on invites sent and invite errors.