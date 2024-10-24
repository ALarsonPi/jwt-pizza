# DevOps SMTP Project

## Backstory
Two years ago I wrote an app that allows families to share an interactive chore chart (based on Concentric Rings for daily, weekly, and monthly chores). I tried to market the app to friends and online, but it didn't really go anywhere. For whatever reason, though, me and my wife still share a chore chart and update it pretty consistently with uplifting and encouraging messages for each other. 

One problem though: we there was no way to know when it was updated, so we would have to go in every so often and check (which was a bit annoying).

## Basic Overview of Curiosity Project
Today I got up and decided to fix this problem. So I pulled up my Flutter App and since it's already set up with Firebase, I made a Firebase serverless function that listens for changes to the chare chart database and then sends an email to me and my wife.

A few things I learned along the way
 - Firebase 2.0 Secrets and ENV config setup
 - Typescript -> Javascript Compilation Problems
 - How to interact with a Mail Server
 - How to get Authenticated with my own domain name
 - How to avoid security leaks


### Firebase
2 years ago, Firebase v1.0 was the bee's knees. It was quick to set up, deploy, and learn about through accurate documentation. I was surprised when working on this project that the Firebase 2.0 update would affect me as much as it did. Most of the changes were small like a depreciated function here or there, but the biggest change was how Firebase handled ENV config variables.

Firebase used to allow for something like this:
`myApiKey = firebase.functions.config().configVar.apiKey`

But the system for holding those ENV vars has changed dramatically. Now one has to add a line like this:
`const myApiKeyFromEnv = defineSecret('API_KEY');
 const actualApiKey = myApiKeyFromEnv.value()`
and this command: `firebase functions:secrets:set API_KEY`

It took me a bit to figure out why set secrets:set command wasn't working. Turns out, I had an outdated npm CLI version. So I had to get my SDK and CLI back in sync before I could set the secrets and use them in my code.

 ### Typescript -> Javascript
Everytime I run into a format of typescript I'm not familiar with, I get a bit nervous. Instead of having `export class MyClass` the code could just have a `module.export = MyClass` and the difference between `require('package') from 'package_source'` rather than `import package from 'package_source'`

I also learned that the `firebase-admin` package (needed to access the ENV from above) has `#private` tags throughout which only work in certain versions of node. So I learned how to set my version of node and the typescript target (in this case ES2022). 

### Mail Servers
Something I was mainly curious about for this project was how mail servers work. Why do we need them? Where are they hosted? Which should be used?

I did some research on various mail servers and settled on MailGun since it has a generous free tier and if I wanted I could attach a custom domain.

After some testing, I figured out how to send mail to the `sandbox` email they provided for me to play around with. Then I got the apiKey and domain set up as secrets in the Firebase function and was finally able to send an email to myself when data updated in my chore chart app. 

One problem though: every email went straight to SPAM. Since the point of sending the emails was visibillity, this just wouldn't do.

### Connecting MailGun to my own Domain
I ended up learning a lot more about CNAME records, MX Mail records, and TXT records as well. I also learned that Mail Servers have a trust system and that if enough people mark mail from your website as SPAM these Mail Servers will stop trusting your website and will start to auto-direct mail to SPAM instead of people's main inbox. To avoid the danger of making one's main domain untrustworthy, mailgun recommended I create a subdomain to send my emails from.

To prove your domain is trustworthy, you have to have a CNAME pointing to mailgun, some MX Mail records which allow incoming mail, and some TXT records which held some info about the subdomain, and held an RSA encryption key so that messages sent in the server would be protected by encryption along the way.

After setting that all up, I added my last code change to the repo and pushed it - excited to see my email server get an email right to the top of my inbox, perfectly trusted.

HOWEVER...

### Security Leaks
Turns out that despite my best efforts to ensure that my keys remained in secrets and didn't make it into source control, a seemingly innocent file called Firebase-debug.logs was added to source control and had within it every key I had been trying to protect. As soon as that file got committed instead of seeing my own email in my inbox, I saw a swarm of GitGuardian emails informing me of a leak. My MailGun account detected these and immediately disabled my account - demanding that I fix the breach before I could send any more emails.



