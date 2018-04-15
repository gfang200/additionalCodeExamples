const debug = require('debug')('nflx-selenium');
const {Builder, By, Key, until} = require('selenium-webdriver');
require('geckodriver')
// const {FatalError, RetriableError} = require('../../errors.js');
const {STATUS} = require('../../server/submo/status.js');


/**
 * Useful Commands
 * 
 * CHECK IF THE CURRENT PAGE IS THE EXPECTED PAGE
        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            if(url != 'https://www.netflix.com/signup/creditoption') {
                throw new FatalError("Unknown");
            } 
        })
 * 
 * CHECK IF TEXT IS ON THE PAGE
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
 * 
 *ENTER TEXT INFORMATION (usually billing)
        .then(function() {
            return driver.findElement(By.name('firstName')).sendKeys(billing_info.card_info.first_name)
        })
 * 
 * CLICK ON SOMETHING BASED ON THE TEXT
        .then(function(){
            return driver.findElement(By.xpath("//*[contains(text(), 'Continue')]")).click()
        })
 * 
 */

//////////////////////////////////////////////////////////////
//LINK ACCOUNT

linkAccount = async function(username, password) {
    debug("Linking account...");
    var driver = new Builder()
        .forBrowser('firefox')
        //.usingServer(process.env.SELENIUM)
        .build();
    // redirect to login - if successful we can link the account
    // otherwise, we can't
    // return login(driver, username, password);
    // driver.quit(); 
    var pLogin = login(driver,username, password);
    pLogin.catch().then(() => driver.quit());
    return pLogin;
}

async function login(driver, username, password) {
    debug("Log in requested...");
    return driver.get('LOGIN PAGE')
        .then(function() {
            debug("Page loaded.");
            debug("Entering username...");
            return driver.findElement(By.name("LOGIN EMAIL FIELD")).sendKeys(username); 
            

        }).then(function(){
            debug("Entering password...");
            return driver.findElement(By.name("LOGIN PASSWORD FIELD")).sendKeys(password) ;
            

        }).then(function(){
            return driver.sleep(1000)

        }).then(function(){
            debug("Submitting...");
            return driver.findElement(By.xpath("//*[contains(text(), 'LOGIN BUTTON TEXT')]")).click()
            

        }).then(function(){
            return driver.sleep(1000)

        }).then(function() {
            return driver.getCurrentUrl();

        }).then(function(url) {
            debug("Login redirected to: " + url);
            if(url != 'LOGIN SUCCESS PAGE') {
                throw new FatalError("Login credentials failed");
            } 
            return true;

        }).catch(function(error) {
            driver.quit();
            console.log(error);});
}

 
//  DO NOT CHANGE
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
        return {status: pState, options: pOptions};
    })
}


// getOptions is a generic function, should be defined for any subscription
// The idea is that there are always 3 standardized pieces of getOptions:

async function getOptions(driver) {

    // 1: optionsSchema - This is the options schema as defined by the subscription object in mongoDB.
    // The optionsSchema defines what the output of the getOptions function should return
    // This piece guarentees that we don't have any incorrect options in our data
    var optionsSchema = {
        'Option Name in MongoDB':'',
        'Option Name in MongoDB':'',
        'Option Name in MongoDB':''
    };
    // 2:optionsMap - This represents how the web representation of the options maps back possible values
    // The optionsMap defines the allowed values and how we determine them by what the sub site presents to us (needs understanding of subscription to create)
    // This piece guarentees that we don't have any incorrect options values in our data
    var optionsMap = {
        'Web Text':'Option Name in MongoDb',
        'Web Text':'Option Name in MongoDb',
        'Web Text':'Option Name in MongoDb'
    };
    // 3:dataMap - This controls the flow of data through the getOptions execution
    // Because async functions can only callback 1 object, we need a way to pass the optionsSchema through the waterfall while filling it out
    // This piece guarentees that we have consistancy throuhgout our workflow
    var dataMap = {
        'schema':optionsSchema,
        'variable1':'',
        'variable2':'',
        'variableN':''
    };

    return driver.get('STARTING PAGE AFTER LOGIN')

        //  TODO first step, and set up live_data
        .then(function(){
            return planRef = driver.DO_SOMETHING




        })

        //  TODO template step to fill out data map
        .then(function(planRef){
            


            dataMap.planRef = planRef;

            return planRef2 = driver.DO_SOMETHING


        })
        

        //  Map and Return
        .then(function(live_data){

            optionsSchema = live_data.schema['Choose your Plan'] = optionsMap[live_data.plan];
            //  The last step will always return 1: optionsSchema, which is always included as part of 3: dataMap
            //  This step uses 2: optionsMap to enforce the values that can go into 1: optionsSchema
            //  Because 1: optionsSchema is based on the options schema in mongoDB, we should be able to directly map it to the object
            return optionsSchema
        })
}

async function getState(driver) {

    return driver.get('PAGE WITH ACTIVE/INACTIVE INFORMATION')

        .then(function() {
            // TODO get to the page that tells you if the account is active or inactive
        })

        .then(function(){
            cancel_found = driver.findElement(By.tagName("HTML")).getText()
            return cancel_found
        })
        
        .then(function(cancel_found){
            // TODO fill out what will be on the page if the account is active
            var account_active = "";
            if (cancel_found.indexOf(account_active) != -1){
                return STATUS.ACTIVE
            }else{
                return STATUS.INACTIVE
            }

        })
}

////////////////////////////////////////////////
//  Sign up base

//  DO NOT CHANGE
signUp = async function(username, password, options, payment, cvv) {
    debug("Signing up...");
    var driver = new Builder()
        .forBrowser('firefox')
        //.usingServer(process.env.SELENIUM)
        .build();
    
    registration = register(driver, username, password, options, payment,cvv);

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
    'MongoDB option':'MongoDB option value'
    };



async function register(driver, username, password, options, billing_info, cvv){

    //TODO fill out first page of sign up flow
    return driver.get('FIRST PAGE OF SIGNUP FLOW')
        //  VERIFY THAT WE ARE ON THE CORRECT STEP
        .then(function(){
            return driver.sleep(1000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'FIRST PAGE OF THIS FLOW') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })


        //  TEMPLATE OF A STEP
        //  TODO do actions to complete flow, checking that the page is as expected at each point
        .then(function() {

            //  TODO if there's an option input here, build the map from input to the page, if not this is not necessary
            var optionMap = {
                'Option 1': 'XPATH',
                'Option 2': 'XPATH',
                'Option 3': 'XPATH'
            };
            
            //  TODO rest of action
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(1000);
        })
        .then(function() {
            return driver.getCurrentUrl();
        })

        //  TODO Choose 1 or both methods of verification
        .then(function(url){
            debug("Signup redirected to: " + url);
            //  TODO fill out expected URL
            expected_url = '';
            if(url != expected_url) {
                //  TODO enter descriptive error, or unknown if the error is not expected
                throw new FatalError("Unknown");
            } 
        })
        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            debug("Checking if account is active. . .");
            //  TODO fill out expected word
            expected_word = '';
            if (check.indexOf(expected_word) == -1){
                debug("Account is active");
                //  TODO descriptive error if possible
                throw new FatalError(expected_word + " Not found")
            }
        })




        //  END
        .then(function(){return driver})
        .catch(function(error) {
            throw error;
            return driver;
        });
}



////////////////////////////////////////////////////////////////////////////////
// start activate

//  DO NOT CHANGE
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
    return driver.get('FIRST PAGE OF THIS FLOW')

       //  verify that we are starting in the right place
        .then(function(){
            return driver.sleep(1000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'FIRST PAGE OF THIS FLOW') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })

        //  TEMPLATE OF A STEP
        //  TODO do actions to complete flow, checking that the page is as expected at each point
        .then(function() {

            //  TODO if there's an option input here, build the map from input to the page, if not this is not necessary
            var optionMap = {
                'Option 1': 'XPATH',
                'Option 2': 'XPATH',
                'Option 3': 'XPATH'
            };
            
            //  TODO rest of action
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(1000);
        })
        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            //  TODO fill out expected URL
            expected_url = '';
            if(url != expected_url) {
                //  TODO enter descriptive error, or unknown if the error is not expected
                throw new FatalError("Unknown");
            } 
        })
        //  TODO Choose 1 or both methods of verification
        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            debug("Checking if account is active. . .");
            //  TODO fill out expected word
            expected_word = '';
            if (check.indexOf(expected_word) == -1){
                debug("Account is active");
                //  TODO descriptive error if possible
                throw new FatalError(expected_word + " Not found")
            }
        })


        //  END
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

//  DO NOT CHANGE
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

               //  verify that we are starting in the right place
        .then(function(){
            return driver.sleep(1000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'FIRST PAGE OF THIS FLOW') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })

        //  TEMPLATE OF A STEP
        //  TODO do actions to complete flow, checking that the page is as expected at each point
        .then(function() {

            //  TODO if there's an option input here, build the map from input to the page, if not this is not necessary
            var optionMap = {
                'Option 1': 'XPATH',
                'Option 2': 'XPATH',
                'Option 3': 'XPATH'
            };
            
            //  TODO rest of action
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(1000);
        })
        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            //  TODO fill out expected URL
            expected_url = '';
            if(url != expected_url) {
                //  TODO enter descriptive error, or unknown if the error is not expected
                throw new FatalError("Unknown");
            } 
        })
        //  TODO Choose 1 or both methods of verification
        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            debug("Checking if account is active. . .");
            //  TODO fill out expected word
            expected_word = '';
            if (check.indexOf(expected_word) == -1){
                debug("Account is active");
                //  TODO descriptive error if possible
                throw new FatalError(expected_word + " Not found")
            }
        })

        //  END
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

              //  verify that we are starting in the right place
        .then(function(){
            return driver.sleep(1000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'FIRST PAGE OF THIS FLOW') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })

        //  TEMPLATE OF A STEP
        //  TODO do actions to complete flow, checking that the page is as expected at each point
        .then(function() {

            //  TODO if there's an option input here, build the map from input to the page, if not this is not necessary
            var optionMap = {
                'Option 1': 'XPATH',
                'Option 2': 'XPATH',
                'Option 3': 'XPATH'
            };
            
            //  TODO rest of action
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(1000);
        })
        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Signup redirected to: " + url);
            //  TODO fill out expected URL
            expected_url = '';
            if(url != expected_url) {
                //  TODO enter descriptive error, or unknown if the error is not expected
                throw new FatalError("Unknown");
            } 
        })
        //  TODO Choose 1 or both methods of verification
        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            debug("Checking if account is active. . .");
            //  TODO fill out expected word
            expected_word = '';
            if (check.indexOf(expected_word) == -1){
                debug("Account is active");
                //  TODO descriptive error if possible
                throw new FatalError(expected_word + " Not found")
            }
        })

        .then(function(){
            debug("Cancellation success!")
            return driver})


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







