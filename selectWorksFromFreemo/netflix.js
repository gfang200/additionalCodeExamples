const debug = require('debug')('nflx-selenium');
const {Builder, By, Key, until} = require('selenium-webdriver');
require('geckodriver')
// const {FatalError, RetriableError} = require('../../errors.js');
const {STATUS} = require('../../server/submo/status.js');

getStatus = async function(username, password) {
    debug("Retrieving status...");
    var driver = new Builder()
    .forBrowser('firefox')
    //.usingServer(process.env.SELENIUM)
    .build();
    // Attempt to log in with the provided credentials
    // after success, retrieve the options and the status
    var pLogin = login(driver, username, password)
    var pOptions = pLogin.then(() => getOptions(driver));
    var pState = pLogin.then(() => getState(driver));
    return Promise.all([pOptions, pState]).then(([pOptions, pState]) => {
        driver.quit();
        debug({status: pState, options: pOptions});
        console.log({status: pState, options: pOptions})
        return {status: pState, options: pOptions};
    })
}



// Test accounts, one is active, one is inactive

//getStatus('tryfreemo@gmail.com','quick_battery_staple93',driver) 

// getOptions is a generic function, should be defined for any subscription
// The idea is that there are always 3 standardized pieces of getOptions:

async function getOptions(driver) {

    // 1: optionsSchema - This is the options schema as defined by the subscription object in mongoDB.
    // The optionsSchema defines what the output of the getOptions function should return
    // This piece guarentees that we don't have any incorrect options in our data
    var optionsSchema = {
        'Choose your Plan':''
    };
    // 2:optionsMap - This represents how the web representation of the options maps back possible values
    // The optionsMap defines the allowed values and how we determine them by what the sub site presents to us (needs understanding of subscription to create)
    // This piece guarentees that we don't have any incorrect options values in our data
    var optionsMap = {
        '2 Screens +':'Standard',
        '1 Screen':'Standard',
        '4 Screens +':'Premium',
        'Add streaming plan':'Basic'
    };
    // 3:dataMap - This controls the flow of data through the getOptions execution
    // Because async functions can only callback 1 object, we need a way to pass the optionsSchema through the waterfall while filling it out
    // This piece guarentees that we have consistancy throuhgout our workflow
    var dataMap = {
        'schema':optionsSchema,
        'planRef':'',
        'plan':''
    };

    return driver.get('http://www.netflix.com/youraccount/')

        .then(function(){
            //  Here we need to use whatever method is best to scrape the site, in the case of netflix, I use
            //  the relative position from an absolute object on the page to determine where the plan details are
            planRef = driver.findElement(By.xpath("//*[contains(text(), 'PLAN DETAILS')]")).getAttribute("data-reactid");
            //  Make a live copy of the dataMap, which will be responsible for passing values through the flow
            live_data = dataMap;
            //  Another promise may be unncessary, but making sure that the promise is resolved when mapped
            return Promise.resolve(planRef).then((planRef) => {
                live_data.planRef = planRef;
                //  Every step except the last will return the dataMap which will be passed through the flow.
                return live_data;
            })         
        })

        .then(function(live_data){
            //  Adding the relative position from the PLAN DETAILS that is the current plan to get the position of the current plan
            planID = parseInt(live_data.planRef)+6;
            plan=driver.findElement(By.xpath('//*[@data-reactid="'+planID+'"]')).getText();
            
            return Promise.resolve(plan).then((plan) => {
                live_data.plan = plan;
                //  Every step except the last will return the dataMap which will be passed through the flow.
                return live_data;
            })
        })
        
        .then(function(live_data){

            optionsSchema = live_data.schema['Choose your Plan'] = optionsMap[live_data.plan];
            //  The last step will always return 1: optionsSchema, which is always included as part of 3: dataMap
            //  This step uses 2: optionsMap to enforce the values that can go into 1: optionsSchema
            //  Because 1: optionsSchema is based on the options schema in mongoDB, we should be able to directly map it to the object
            return optionsSchema
        })
}

async function getState(driver) {

    return driver.get('http://www.netflix.com/youraccount/')

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            if(url != 'https://www.netflix.com/youraccount/') {
                throw new FatalError("Unknown");
            } 
        })

        .then(function(){
            cancel_found = driver.findElement(By.tagName("HTML")).getText()
            return cancel_found
        })
        
        .then(function(cancel_found){
            console.log(cancel_found)
            if (cancel_found.indexOf("Cancel") != -1){
                return STATUS.ACTIVE
            }else{
                return STATUS.INACTIVE
            }

        })
}

////////////////////////////////////////////////
//  Sign up base
signUp = async function(username, password, options, payment, cvv) {
    debug("Signing up...");
    var driver = new Builder()
        .forBrowser('firefox')
        //.usingServer(process.env.SELENIUM)
        .build();
    // Attempt to sign up with the provided credentials
    // if we succeeded, then we can proceed and save the account
    
    registration = register(driver, username, password, options, payment,cvv);

    //  Once we can get the error catching to work, let's find a way to present the error to the user so they know what to fix
    return Promise.resolve(registration).then(function(registration) {
        driver.quit();
        return registration
    }).catch(function(error) {
        driver.quit();
        console.log(error);})
}

//  Fake user information, expect this to be passed into submo
user =  {
    card_info:{
      first_name: "Goob",
      last_name:"LEQ",
      credit_card_number: "4111 1111 1111 1111",
      last_four: "1111",
      billing_zip: "01720",
      exp_m: "12",
      exp_y: "22"
    },
    billing_address: {

      zip: "01720",

    }
  }

  //  Fake options, expect this to be passed into submo
  var options = {
    'Choose your Plan':'Standard'
    };

//  Fake sign up information
//  signUp('goobleq123412@gmail.com','quick_battery_staple93',options, user, 123) 


//  Registration core function
//  ATM I left all the sleeps in because I think there's a bit of page load javascript trickery that makes the fomrs delayed
//  We can also use some kind of wait for element loop maybe
async function register(driver, username, password, options, billing_info, cvv){
    return driver.get('http://www.netflix.com/signup/')

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            if(url != 'https://www.netflix.com/signup/') {
                throw new FatalError("Unknown");
            } 
        })

        .then(function(){
            debug("Starting Signup");
            return driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click();
        })
        .then(function() {
            return driver.sleep(1000);
        })

        //  So this is the period checker function that's called on every page change to make sure that website is behaving as expected
        //  only going to comment this one time, but essentially, it's supposed to throw an error on unexpected behavior
        //  Ideally we should know all of the failure states to log it to the user, if there's no reason it should fail I just use unknown
        //  Unless netflix changes there flow, user should never see this
        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            if(url != 'https://www.netflix.com/signup/planform') {
                throw new FatalError("Unknown");
            } 
        })

        .then(function(){
            
            //  Every option will have to be manually coded in at the appropriate option input stage
            //  in this case it's picking the netflix plan with 3 buttons depending on the plan
            var optionMap = {
                'Standard': '//*[@id="appMountPoint"]/div/div[2]/div/div[1]/div[2]/div[1]/div[2]/div[3]/span/div/div[1]/div',
                'Basic': '//*[@id="appMountPoint"]/div/div[2]/div/div[1]/div[2]/div[1]/div[2]/div[2]',
                'Premium': '//*[@id="appMountPoint"]/div/div[2]/div/div[1]/div[2]/div[1]/div[2]/div[4]/span/div/div[1]/div'
            };

            return driver.findElement(By.xpath(optionMap[options["Choose your Plan"]])).click();
        })
        .then(function() {
            return driver.sleep(1000);
        })
        .then(function() {
            return driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click();
        })
        .then(function() {
            return driver.sleep(1000);
        })

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            if(url != 'https://www.netflix.com/signup/registration') {
                throw new FatalError("Unknown");
            } 
        })

        .then(function() {
            return driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click();
        })
        .then(function() {
            return driver.sleep(1000);
        })

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            if(url != 'https://www.netflix.com/signup/regform') {
                throw new FatalError("Unknown");
            } 
        })

        .then(function() {
            debug("Entering account information");
            return driver.findElement(By.name("email")).sendKeys(username);
        })
        .then(function(){
            return driver.findElement(By.name("password")).sendKeys(password);
        })
        .then(function(){
            return driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click();
        })
        .then(function() {
            return driver.sleep(2000);
        })

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            if(url != 'https://www.netflix.com/signup/payment') {
                throw new FatalError("Email/Password Error (Likely account already exists)");
            } 
        })

        .then(function(){
            return driver.findElement(By.css('.paymentPicker')).click();
        })
        .then(function() {
            return driver.sleep(1000);
        })


        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            if(url != 'https://www.netflix.com/signup/creditoption') {
                throw new FatalError("Unknown");
            } 
        })


        .then(function() {
            debug("Entering billing information");
            return driver.findElement(By.name('firstName')).sendKeys(billing_info.card_info.first_name)
        })
        .then(function() {
            return driver.findElement(By.name('lastName')).sendKeys(billing_info.card_info.last_name)
        })
        .then(function() {
            return driver.findElement(By.name('creditCardNumber')).sendKeys(billing_info.card_info.credit_card_number)
        })            
        .then(function() {
            return driver.findElement(By.name('creditExpirationMonth')).sendKeys(billing_info.card_info.exp_m + "/" + billing_info.card_info.exp_y)
        })
        .then(function() {
            return driver.findElement(By.name('creditZipcode')).sendKeys(billing_info.billing_address.zip)
        })
        .then(function() {
            return driver.findElement(By.name('creditCardSecurityCode')).sendKeys(cvv)
        })
        .then(function() {
            return driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click()
        })
        .then(function() {
            return driver.sleep(1000);
        })

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            console.log("Signup redirected to: " + url)
            if(url == 'https://www.netflix.com/signup/creditoption') {
                console.log('FATAL ERROR')
                throw new FatalError("Billing failed");
            } 
        })

        .then(function(){return driver})
        .catch(function(error) {
            throw error;
            return driver;
        });
}



////////////////////////////////////////////////////////////////////////////////
// start activate

activate = async function(username, password) {
    debug("Activating account...");
    var driver = new Builder()
        .forBrowser('firefox')
        //.usingServer(process.env.SELENIUM)
        .build();
    // Attempt to log in with the provided credentials
    // if we succeeded, then we can proceed and activate the account
    activation = login(driver, username, password).then(
        () => restart(driver).then(() => driver.quit())
    );

    return Promise.resolve(activation).then(function(activation) {
        return activation;
    }).catch(function(error) {
        driver.quit();
        console.log(error);})
}


async function restart(driver) {
    return driver.get('http://www.netflix.com/youraccount/')

        .then(function(){
            return driver.sleep(1000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'https://www.netflix.com/youraccount/') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })

        //  Page check function when we want to check the state of things
        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            debug("Checking if account is active. . .");
            if (check.indexOf("Restart Membership") == -1){
                debug("Account is active");
                throw new FatalError("Account is already active")
            }
        })
        
        .then(function(){
            debug("Restarting Membership");
            return driver.findElement(By.xpath("//*[contains(text(), 'Restart Membership')]")).click()})

        .then(function(){
            return driver.sleep(1000)})

        //  Confirm end state
        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            debug("Checking if account is active. . .");
            if (check.indexOf("Your streaming plan has been restarted") == -1){
                debug("Activation Failed");
                throw new FatalError("Activation Failed, is your billing up to date?")
            }
        })


        .then(function(){
            debug("Activation success!")
            return driver})

        .catch(function(error){throw error});
}



////////////////////////////////////////////////////////////////////////////////////////////////////
//Start Cancel

// Params: username, password
// Returns: true or false to indicate whether subscription deactivation
// actions succeeded
deactivate = async function(username, password) {
    debug("Deactivating account...");
    var driver = new Builder()
        .forBrowser('firefox')
        //.usingServer(process.env.SELENIUM)
        .build();
    // Attempt to log in with the provided credentials
    // if we succeeded, then we can proceed and deactivate the account
    deactivation = login(driver, username, password).then(
        () => cancel(driver).then(() =>driver.quit())
    );

    return Promise.resolve(deactivation).then(function(deactivation) {
        return deactivation
    }).catch(function(error) {
        driver.quit();
        console.log(error);})
}

async function cancel(driver) {
    return driver.get('http://www.netflix.com/cancelplan/')

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'https://www.netflix.com/cancelplan/') {
                throw new FatalError("Can't reach cancel plan page, your account is likely not active.");
            } 
        })


        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            debug("Checking if account is active. . .");
            if (check.indexOf("Finish Cancellation") == -1){
                debug("Account is inactive");
                throw new FatalError("Account is already inactive")
            }
        })

        .then(function() {
            debug("Reactivating");
            return driver.findElement(By.xpath("//*[contains(text(), 'Finish Cancellation')]")).click()
        })

        .then(function() {
            driver.sleep(1000)})


        //  Confirm end state
        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            debug("Checking if account is cancelled. . .");
            if (check.indexOf("We've Canceled Your Membership") == -1){
                debug("Cancellation Failed");
                throw new FatalError("Cancellation Failed")
            }
        })

        .then(function(){
            debug("Cancellation success!")
            return driver})

        .catch(function(error){throw error});
}



////////////////////////////////////////////////////////////////////////////////////////////////////
//Start Set Options
setOptions = async function(username, password, options) {
    debug("Setting account options...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
        .build();
    // Attempt to log in with the provided credentials
    // if we succeeded, then we can proceed and update account options
    optionsSet = login(driver, username, password).then(
        () => modAccount(driver, options)
    );

    return Promise.resolve(optionsSet).then(function(optionsSet) {
        return optionsSet
    }).catch(function(error) {
        driver.quit();
        console.log(error);})
}

async function modAccount(driver, options) {
    return driver.get('https://www.netflix.com/ChangePlan')

    .then(function(){
        return driver.sleep(1000)})

    .then(function() {
        return driver.getCurrentUrl();
    })
    .then(function(url){
        debug("Redirected to: " + url);
        if(url != 'https://www.netflix.com/ChangePlan') {
            debug("Redirection Failed");
            throw new FatalError("Unknown");
        } 
    })

    //  Page check function when we want to check the state of things
    .then(function(){
        return driver.findElement(By.tagName("HTML")).getText()
    })     
    .then(function(check){
     
        if (check.indexOf("Change Streaming Plan") == -1){
            throw new FatalError("Cannot change plan")
        }
    })

    .then(function(){
        var optionMap = {
            'Basic':'//*[@id="appMountPoint"]/div/div[2]/div/div/ul/li[1]/div[4]/div',
            'Standard':'//*[@id="appMountPoint"]/div/div[2]/div/div/ul/li[2]/div[4]/div',
            'Premium':'//*[@id="appMountPoint"]/div/div[2]/div/div/ul/li[3]/div[4]'
        }

        return driver.findElement(By.xpath(optionMap[options["Choose your Plan"]])).click();
        
    })

    .then(function(){
        return driver.sleep(1000)
    })

    .then(function(){
        return driver.findElement(By.xpath("//*[contains(text(), 'Continue')]")).click()
    })
    .then(function(){
        return driver.sleep(1000)
    })

        //  Page check function when we want to check the state of things
    .then(function(){
        return driver.findElement(By.tagName("HTML")).getText()
    })     
    .then(function(check){
     
        if (check.indexOf("Confirm Change") == -1){
            throw new FatalError("Already changed plan this billing period.")
        }
    })

    .then(function(){
        return driver.findElement(By.xpath("//*[contains(text(), 'Confirm Change')]")).click()
    })
    .then(function(){
        return driver.sleep(1000)
    })


    .catch(function(error){throw error});
      



}

var options = {
    'Choose your Plan':'Standard'
    };


























    // Params: username, password
// Returns: true or false to indicate whether linking this account
// succeeded
exports.linkAccount = async function(username, password) {
    debug("Linking account...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
        .build();
    // redirect to login - if successful we can link the account
    // otherwise, we can't
    // return login(driver, username, password);
    // driver.quit(); 
    var pLogin = login(driver,username, password);
    pLogin.catch().then(() => driver.quit());
    return pLogin;
}

// Params: username, password
// Returns: true or false to indicate whether sign up actions succeeded
exports.signUp = async function(username, passsword, payment) {
    debug("Signing up...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
        .build();
    // Attempt to sign up with the provided credentials
    // if we succeeded, then we can proceed and save the account
    return signUp(driver, username, password, payment);
}

// Params: username, password
// Returns: true or false to indicate whether subscription activation
// actions succeeded
exports.activate = async function(username, password) {
    debug("Activating account...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
        .build();
    // Attempt to log in with the provided credentials
    // if we succeeded, then we can proceed and activate the account
    return login(driver, username, password).then(
        () => activate(driver)
    );
}

// Params: username, password
// Returns: true or false to indicate whether subscription deactivation
// actions succeeded
exports.deactivate = async function(username, password) {
    debug("Deactivating account...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
        .build();
    // Attempt to log in with the provided credentials
    // if we succeeded, then we can proceed and deactivate the account
    return login(driver, username, password).then(
        () => deactivate(driver)
    );
}

// Params: username, password
// Returns: true or false to indicate whether setting options succeeded
exports.setOptions = async function(username, password, options) {
    debug("Setting account options...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
        .build();
    // Attempt to log in with the provided credentials
    // if we succeeded, then we can proceed and update account options
    return login(driver, username, password).then(
        () => setOptions(driver, options)
    );
}

// HELPERS AND SETUP ////////////////////////////////////////////////
async function login(driver, username, password) {
    debug("Log in requested...");
    return driver.get('http://www.netflix.com/login/')
        .then(() =>{
            debug("Page loaded.");
            driver.findElement(By.name("email")).sendKeys(username); 
            debug("Entering username...");
        }).then(() =>{
            driver.findElement(By.name("password")).sendKeys(password) ;
            debug("Entering password...");
        }).then(() =>
            driver.sleep(1000)
        ).then(() =>{
            driver.findElement(By.css('.login-button.btn')).click(); 
            debug("Submitting...");
        }).then(() =>
            driver.sleep(1000)
        ).then(() => {
            return driver.getCurrentUrl();
        }).then((url) => {
            debug("Login redirected to: " + url);
            if(url != 'https://www.netflix.com/browse' && url != 'https://www.netflix.com/signup') {
                throw new FatalError("Login credentials failed");
            } 
            return true;
        }).catch(error => {
        driver.quit();
        process.exit;});
}






