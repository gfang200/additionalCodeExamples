const debug = require('debug')('nflx-selenium');
const {Builder, By, Key, until} = require('selenium-webdriver');
const {FatalError, RetriableError} = require('../../errors.js');
const {STATUS} = require('../../status.js');

// Management functions - each of these should instantiate a new driver
// and chain via the new instance so that user information is paritioned correctly

// All of these functions return promises (async function). The promises
// resolve to either a type (boolean, string) on success, or an error
// on failure

// Params: username, password
// Returns: an object representing the status and options
// for the user
// E.g. {status: STATUS.ACTIVE, options: {plan: "basic"}}
exports.getStatus = async function(username, password) {
    debug("Retrieving status...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
        .build();
    // Attempt to log in with the provided credentials
    // after success, retrieve the plan and the status
    var pLogin = login(driver, username, password)
    var pPlan = pLogin.then(() => getPlan(driver));
    var pStatus = pLogin.then(() => getStatus(driver));
    return Promise.all([pPlan, pStatus]).then(([pPlan, pStatus]) => {
        return {status: pStatus, opions: {plan: pPlan}};
    });
}

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
            if(url != 'https://www.netflix.com/browse') {
                throw new FatalError("Login credentials failed");
            } 
            return true;
        }).catch(error => {throw error;});
}

async function signUp(driver, username, password, payment){
    return driver.get('http://www.netflix.com/signup/')
        .then(() =>
            driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click())
        .then(() =>
            driver.sleep(1000))
        .then(() =>
            driver.findElement(By.xpath('//*[@id="appMountPoint"]/div/div[2]/div/div[1]/div[2]/div[1]/div[2]/div[2]')).click())
        .then(() =>
            driver.sleep(1000))
        .then(() =>
            driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click())
        .then(() =>
            driver.sleep(1000))
        .then(() =>
            driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click())
        .then(() =>
            driver.sleep(1000))
        .then(() =>
            driver.findElement(By.name("email")).sendKeys(username))
        .then(()=>
            driver.findElement(By.name("password")).sendKeys(password))
        .then(() =>
            driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click())
        .then(() =>
            driver.sleep(2000))
        .then(() =>
            driver.findElement(By.css('.paymentPicker')).click())
        .then(() =>
            driver.sleep(1000))
        .then(() =>
            driver.findElement(By.name('firstName')).sendKeys(payment.first_name))
        .then(() =>
            driver.findElement(By.name('lastName')).sendKeys(payment.last_name))
        .then(() =>
            driver.findElement(By.name('creditCardNumber')).sendKeys(payment.credit_card_number))
        .then(() =>
            driver.findElement(By.name('creditExpirationMonth')).sendKeys(payment.exp_m + "/" + payment.exp_y))
        .then(() =>
            driver.findElement(By.name('creditZipcode')).sendKeys(payment.zip))
        .then(() =>
            driver.findElement(By.name('creditCardSecurityCode')).sendKeys(payment.cvv))
        .then(() =>
            driver.findElement(By.css('.nf-btn.nf-btn-oversize')).click())
        .then(function(){ return driver})
        .catch(function(){return driver});
}

async function activate(driver) {
    return driver.get('http://www.netflix.com/youraccount/')

        .then(_ =>
            driver.sleep(1000))
        
        .then(_ =>
            driver.findElement(By.css('.btn.account-cancel-button')).click())

        .then(_ =>
            driver.sleep(1000))

        .then(function(){
            return driver})
        .catch(function(){return driver});
}

async function deactivate(driver) {
    return driver.get('http://www.netflix.com/cancelplan/')

        .then(_ =>
            driver.findElement(By.css('.btn-bar-left .btn')).click())

        .then(_ =>
            driver.sleep(1000))

        .then(function(){
            return driver})
        .catch(function(){return driver});
}

async function setOptions(driver, options) {

}

async function getPlan(driver) {
    return driver.get('http://www.netflix.com/youraccount/')

        .then(function(){
            plan = driver.findElement(By.xpath('//*[@id="appMountPoint"]/div/div[3]/div/div/div[2]/div[2]/section/div[1]/div/div[1]/div/strong')).getText()

            return plan
        })

        .then(function(plan) {

            state = driver.findElement(By.xpath('//*[@id="appMountPoint"]/div/div[3]/div/div/div[2]/div[1]/header/h2/button')).getText()
            return [plan, state]
        })

        .then (function(states){
            console.log(states[0]+states[1])
        })
        .then(function(){return driver;})
        .catch(function(){return driver})
}

async function getStatus(driver) {

}
