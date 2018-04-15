const debug = require('debug')('hulu-selenium');
const {Builder, By, Key, until} = require('selenium-webdriver');
const {FatalError, RetriableError} = require('../../errors.js');
const {STATE} = require('../../status.js');
require('geckodriver');

exports.getStatus = async function(username, password) {
    debug("Retrieving status...");
    var driver = new Builder()
    .forBrowser('firefox')
    .usingServer(process.env.SELENIUM)
    .build();
    // Attempt to log in with the provided credentials
    // after success, retrieve the options and the status
    var pLogin = login(driver, username, password)
    var pOptions = pLogin.then(() => getOptions(driver));
    var pState = pLogin.then(() => getState(driver));
    return Promise.all([pOptions, pState]).then(([pOptions, pState]) => {
        driver.quit();
        debug({state: pState, options: pOptions});
        console.log({state: pState, options: pOptions})
        return {state: pState, options: pOptions};
    })
}



exports.signUp = async function(username, password, options, profile, address, payment, cvv) {


 
    // console.log('trollerinski')
    debug("Signing up...");
    var driver = new Builder()
        .forBrowser('firefox')
        //.usingServer(process.env.SELENIUM)
        .build();
    // Attempt to sign up with the provided credentials
    // if we succeeded, then we can proceed and save the account
    
    registration = register(driver, username, password, options, profile, address, payment, cvv).then( () => login(driver, username, password).then(
        () => modAccount(driver, options)));

    //  Once we can get the error catching to work, let's find a way to present the error to the user so they know what to fix
    return Promise.resolve(registration).then(function(registration) {
        driver.quit();
        return registration
    }).catch(function(error) {
        driver.quit();
        throw error;
        console.log(error);})
}



// optionMap={
//     'The Humble Twin':'/html/body/div[5]/div/main/article/div/ul/li[1]/div/div[3]/div/button',
//     'The 4x':'/html/body/div[5]/div/main/article/div/ul/li[2]/div/div[3]/div/button',
//     'The Executive':'/html/body/div[5]/div/main/article/div/ul/li[3]/div/div[3]/div/button'
// }
let username = 'george@tryfreemo.com'
let password = 'quick_battery_staple93'
let options = { Starter: 'Daily Essentials',
Razor_Type:'The Humble Twin'}
let profile = { first_name: 'George', last_name: 'Fang' }
let address = { first_name: 'George',
            last_name: 'Fang',
            address_line_1: '1 St Francis Pl',
            address_line_2: 'Apt 5201',
            zip: '94107',
            city: 'San Francisco',
            state: 'CA' }
let payment = { '$init': true,
billing_address: 
 { '$init': true,
   state: 'CA',
   city: 'San Francisco',
   zip: '94107',
   address_line_2: '',
   address_line_1: '1 St Francis Pl',
   last_name: 'Fang',
   first_name: 'George' },
card_info: 
 { '$init': true,
   exp_y: '23',
   exp_m: '02',
   billing_zip: '94107',
   last_four: '2064',
   credit_card_number: '4147 2023 4295 2064',
   last_name: 'Fang',
   first_name: 'George' } }
let cvv ="104"


//exports.signUp(username,password,options,profile,address,payment,cvv)



exports.activate = async function(username, password) {
    debug("Activating account...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
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
        throw error;
        console.log(error);})
}

exports.deactivate = async function(username, password) {
    debug("Deactivating account...");
    var driver = new Builder()
        .forBrowser('firefox')
        .usingServer(process.env.SELENIUM)
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
        throw error;
        console.log(error);})
}

exports.setOptions = async function(username, password, options) {
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
        driver.quit()
        return optionsSet
    }).catch(function(error) {
        driver.quit();
        throw error;
        console.log(error);})
}



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
// exports.linkAccount(username,password)

async function login(driver, username, password) {
    debug("Log in requested...");
    return driver.get('https://www.dollarshaveclub.com/login')

        //  VERIFY THAT WE ARE ON THE CORRECT STEP
        .then(function(){
            return driver.sleep(5000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'https://www.dollarshaveclub.com/login') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })


        .then(function() {
            debug("Page loaded.");
            debug("Entering username...");
            return driver.findElement(By.name("email")).sendKeys(username); 
            

        }).then(function(){
            debug("Entering password...");
            return driver.findElement(By.name("password")).sendKeys(password) ;
            

        }).then(function(){
            return driver.sleep(5000)

        }).then(function(){
            debug("Submitting...");

    
            return driver.findElement(By.xpath('/html/body/div[5]/div/main/div[2]/table/tr/td/table/tr[2]/td/form/button')).click()

            

        }).then(function(){
            return driver.sleep(5000)

        }).then(function() {
            return driver.getCurrentUrl();

        }).then(function(url) {
            debug("Login redirected to: " + url);
            if(url != 'https://www.dollarshaveclub.com/home') {
                throw new FatalError("Login credentials failed");
            } 
            return true;

        }).catch(function(error) {
            driver.quit();
            console.log(error);});
}

 

// getOptions is a generic function, should be defined for any subscription
// The idea is that there are always 3 standardized pieces of getOptions:

async function getOptions(driver) {

    // 1: optionsSchema - This is the options schema as defined by the subscription object in mongoDB.
    // The optionsSchema defines what the output of the getOptions function should return
    // This piece guarentees that we don't have any incorrect options in our data
    var optionsSchema = {
        'Plan':'',
        'Gender':''
    };



    return driver.get('https://secure.hulu.com/account')

        .then(function(){
            cancel_found = driver.findElement(By.tagName("HTML")).getText()
            return cancel_found
        })
        
        .then(function(cancel_found){
            console.log(cancel_found)
            // TODO fill out what will be on the page if the account is active
            if (cancel_found.indexOf("Limited Commercials") != -1){
                optionsSchema.Plan = "Limited Commercials"
            }else{
                optionsSchema.Plan = "No Commercials"
            }

            if (cancel_found.indexOf('Female') != -1){
                optionsSchema.Gender = "Female"
            }else{
                optionsSchema.Gender = "Male"
            }

            return optionsSchema
        })    
        
    
    //  TODO first step, and set up live_data



        


}

async function getState(driver) {

    return driver.get('https://secure.hulu.com/account')


        .then(function(){
            cancel_found = driver.findElement(By.tagName("HTML")).getText()
            return cancel_found
        })
        
        .then(function(cancel_found){
            console.log(cancel_found)
            // TODO fill out what will be on the page if the account is active
            var account_active = "Monthly Recurring Total";
            if (cancel_found.indexOf(account_active) != -1){
                return STATE.ACTIVE
            }else{
                return STATE.INACTIVE
            }

        })
}


async function register(driver, username, password, options, profile, address, payment, cvv){
    // http://shaved.by/isnnP
    return driver.get('https://try.dollarshaveclub.com/firstmonth/?referrer=georgefang73958&utm_campaign=INVITE+PAGE+-+control&utm_content=personal_url&utm_medium=referral&utm_source=Friendbuy')
        //  VERIFY THAT WE ARE ON THE CORRECT STEP
        .then(function(){
            return driver.sleep(5000)})


        .then(function(){

            return driver.findElement(By.xpath("//*[contains(text(), 'Get Started')]")).click()

        })
            
        .then(function(){
            return driver.sleep(10000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'https://www.dollarshaveclub.com/blades') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })


        .then(function(){
            var optionMap = {
                'Razor and Blades only': '/html/body/div[5]/div/main/article/div[1]/ul/li[1]/div[2]/div/button',
                'Daily Essentials': '/html/body/div[5]/div/main/article/div[1]/ul/li[2]/div/ul/li[1]/div/div/a[2]',
                'Ultimate Shave': '/html/body/div[5]/div/main/article/div[1]/ul/li[2]/div/ul/li[2]/div/div/a[2]',
                'Classic Shave': '/html/body/div[5]/div/main/article/div[1]/ul/li[2]/div/ul/li[3]/div/div/a[2]'
            };

            return driver.findElement(By.xpath(optionMap[options["Starter"]])).click();
     
        })

        .then(function(){
            return driver.sleep(5000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'https://www.dollarshaveclub.com/checkout/extras') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })

        .then(function(){

            return driver.findElement(By.xpath('/html/body/div[5]/div/main/article/div/nav/div/button')).click();
     
        })

        .then(function(){
            return driver.sleep(5000)})

        .then(function() {
            debug("Entering account information");
            return driver.findElement(By.name("firstName")).sendKeys(profile.first_name);
        })
        .then(function(){
            return driver.findElement(By.name("lastName")).sendKeys(profile.last_name);
        })
        .then(function(){
            return driver.findElement(By.name("email")).sendKeys(username);
        })
        .then(function(){
            return driver.findElement(By.name("password")).sendKeys(password);
        })

        .then(function(){
            return driver.sleep(5000)})
        
        .then(function(){

            return driver.findElement(By.xpath('/html/body/div[5]/div/main/article/div/div[1]/form/input')).click();
     
        })            

        .then(function(){
            return driver.sleep(5000)})

        .then(function(){
            return driver.findElement(By.name("shippingAddress.addressLine1")).sendKeys(address.address_line_1);
        })
        .then(function(){
            return driver.findElement(By.name("shippingAddress.addressLine2")).sendKeys(address.address_line_2);
        })
        .then(function(){
            return driver.findElement(By.name("shippingAddress.zipCode")).sendKeys(address.zip);
        })


        .then(function(){
            console.log(payment.card_info.credit_card_number);
            return driver.switchTo().frame(driver.findElement(By.xpath('/html/body/div[5]/div/main/article/div/div/div/form/div[3]/div/form/div[2]/div/iframe'))).then(function(){
                
                return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(0))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(1))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(2))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(3))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(5))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(6))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(7))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(8))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(10))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(11))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(12))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(13))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(15))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(16))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(17))
                .then(function(){return driver.findElement(By.name("cc-number")).sendKeys(payment.card_info.credit_card_number.charAt(18))

                .then(function(){return driver.findElement(By.name("cc-exp")).sendKeys(payment.card_info.exp_m.charAt(0))
                .then(function(){return driver.findElement(By.name("cc-exp")).sendKeys(payment.card_info.exp_m.charAt(1))
                .then(function(){return driver.findElement(By.name("cc-exp")).sendKeys(payment.card_info.exp_y.charAt(0))
                .then(function(){return driver.findElement(By.name("cc-exp")).sendKeys(payment.card_info.exp_y.charAt(1))
                .then(function(){return driver.findElement(By.name("cc-cvv")).sendKeys(cvv.charAt(0))
                .then(function(){return driver.findElement(By.name("cc-cvv")).sendKeys(cvv.charAt(1))
                .then(function(){return driver.findElement(By.name("cc-cvv")).sendKeys(cvv.charAt(2))

                .then(function(){return driver.switchTo().defaultContent()

            })

            })
            })
            })
            })
            })            
            })
            })

            })
            })
            })
            })
            })            
            })
            })
            })
            })
            })
            
            })
            })
            })
            })
            })

        })
    })

        .then(function(){
            return driver.findElement(By.xpath("/html/body/div[5]/div/main/article/div/div/div/form/div[3]/div/form/div[3]/span/span")).click();
        })

        .then(function(){
            return driver.findElement(By.name("billingAddress.firstName")).sendKeys(payment.billing_address.first_name);
        })
        .then(function(){
            return driver.findElement(By.name("billingAddress.lastName")).sendKeys(payment.billing_address.last_name);
        })
        .then(function(){
            return driver.findElement(By.name("billingAddress.addressLine1")).sendKeys(payment.billing_address.address_line_1);
        })
        .then(function(){
            return driver.findElement(By.name("billingAddress.addressLine2")).sendKeys(payment.billing_address.address_line_2);
        })
        .then(function(){
            return driver.findElement(By.name("billingAddress.city")).sendKeys(payment.billing_address.city);
        })
        .then(function(){
            return driver.findElement(By.name("billingAddress.zipCode")).sendKeys(payment.billing_address.zip);
        })
        .then(function(){
            var States ={
                "AL":1,
                "AK":2,
                "AZ":3,
                "AR":4,
                "AA":5,
                "AE":6,
                "AP":7,
                "CA":8,
                "CO":9,
                "CT":10,
                "DE":11,
                "DC":12,
                "FL":13,
                "GA":14,
                "HI":15,
                "ID":16,
                "IL":17,
                "IN":18,
                "IA":19,
                "KS":20,
                "KY":21,
                "LA":22,
                "ME":23,
                "MD":24,
                "MA":25,
                "MI":26,
                "MN":27,
                "MS":28,
                "MO":29,
                "MT":30,
                "NE":31,
                "NV":32,
                "NH":33,
                "NJ":34,
                "NM":35,
                "NY":36,
                "NC":37,
                "ND":38,
                "OH":39,
                "OK":40,
                "OR":41,
                "PA":42,
                "RI":43,
                "SC":44,
                "SD":45,
                "TN":46,
                "TX":47,
                "UT":48,
                "VT":49,
                "VA":50,
                "WA":51,
                "WV":52,
                "WI":53,
                "WY":54
            }
            function selectByValue(select, textDesired) {
                select.findElements(By.tagName('option'))
                .then(options => {
                    options.map(option => {
                        option.getAttribute('value').then(text => {
                            if (text == textDesired)
                                option.click();
                        });
                    });
                });
            }

            return driver.findElement(By.name("billingAddress.state")).click().then(function(){
                return selectByValue(driver.findElement(By.name("billingAddress.state")), payment.billing_address.state)
            })
        })


        .then(function(){
            return driver.sleep(5000)})

        .then(function(){
            return driver.findElement(By.xpath('/html/body/div[5]/div/main/article/div/div/div/form/button')).click()})

        .then(function(){
            return driver.sleep(10000)})

        //  END
        .then(function(){return driver})
        .catch(function(error) {

            throw error;
            return driver;
        });
    };


    // let username = 'tryfreemog@gmail.com'
    // let password = 'Asd1234554321'
    // let options = { Starter: 'Daily Essentials'}
    // let profile = { first_name: 'George', last_name: 'F' }
    // let address = { first_name: 'George',
    //             last_name: 'F',
    //             address_line_1: '1 St Francis ',
    //             address_line_2: '',
    //             zip: '94107',
    //             city: 'San Francisco',
    //             state: 'CA' }
    // let payment = { '$init': true,
    // billing_address: 
    //  { '$init': true,
    //    state: '',
    //    city: 'San Francisco',
    //    zip: '94107',
    //    address_line_2: '',
    //    address_line_1: '123 Orange',
    //    last_name: 'F',
    //    first_name: 'George' },
    // card_info: 
    //  { '$init': true,
    //    exp_y: '22',
    //    exp_m: '12',
    //    billing_zip: '94107',
    //    last_four: '1111',
    //    credit_card_number: '4111 1111 1111 1111',
    //    last_name: 'F',
    //    first_name: 'George' } }
    // let cvv =123

async function restart(driver) {
    return driver.get('https://secure.hulu.com/account')
        //  VERIFY THAT WE ARE ON THE CORRECT STEP
        .then(function(){
            return driver.sleep(5000)})


        .then(function() {
            return driver.findElement(By.xpath("/html/body/div[2]/div[4]/div[4]/div/div/div/div[1]/div[1]/section[1]/section/div/section/div[4]/div[1]")).click()
        })


        //  END
        .then(function(){
            debug("Activation success!")
            return driver})

        .catch(function(error){throw error});
}

async function cancel(driver) {
    return driver.get('https://secure.hulu.com/account')

               //  verify that we are starting in the right place
        .then(function(){
            return driver.sleep(5000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'https://secure.hulu.com/account') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })

        //  TEMPLATE OF A STEP
        //  TODO do actions to complete flow, checking that the page is as expected at each point
        .then(function() {
            return driver.findElement(By.xpath('//*[@id="main"]/div/div/div[1]/div[2]/section/div/div[2]/section[2]/a')).click()
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(5000);
        })

        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            expected_word = 'Before you cancel...';
            if (check.indexOf(expected_word) == -1){
                throw new FatalError(expected_word + " Not found")
            }
        })

        .then(function() {
            return driver.findElement(By.xpath('//*[@id="vacation-hold-form"]/div[2]/a[2]')).click()
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(5000);
        })

        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            expected_word = 'Please tell us';
            if (check.indexOf(expected_word) == -1){
                throw new FatalError(expected_word + " Not found")
            }
        })


        .then(function() {
            return driver.findElement(By.xpath("//*[contains(text(), 'too expensive')]")).click()
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(5000);
        })

        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            expected_word = 'Would you be interested in a less expensive option';
            if (check.indexOf(expected_word) == -1){
                throw new FatalError(expected_word + " Not found")
            }
        })

        .then(function() {
            return driver.findElement(By.xpath("//*[contains(text(), 'continue to cancel')]")).click()
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(5000);
        })



        .then(function() {
            return driver.findElement(By.xpath("//*[contains(text(), 'No, cancel subscription')]")).click()
        })
        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(10000);
        })

        .then(function(){
            return driver.findElement(By.tagName("HTML")).getText()
        })     
        .then(function(check){
            expected_word = 'cancelled';
            if (check.indexOf(expected_word) == -1){
                throw new FatalError(expected_word + " Not found")
            }
        })


        //  END
        .then(function(){
            debug("Cancellation success!")
            return driver})

        .catch(function(error){throw error});
}


async function modAccount(driver, options) {
    return driver.get('https://www.dollarshaveclub.com/change-razor-plan')

              //  verify that we are starting in the right place
        .then(function(){
            return driver.sleep(5000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'https://www.dollarshaveclub.com/change-razor-plan') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })

        //  TEMPLATE OF A STEP
        //  TODO do actions to complete flow, checking that the page is as expected at each point 

        .then(function() {

            //  TODO if there's an option input here, build the map from input to the page, if not this is not necessary

            let optionsMap={
                'The Humble Twin':'/html/body/div[5]/div/main/article/div/ul/li[1]/div/div[3]/div/button',
                'The 4x':'/html/body/div[5]/div/main/article/div/ul/li[2]/div/div[3]/div/button',
                'The Executive':'/html/body/div[5]/div/main/article/div/ul/li[3]/div/div[3]/div/button'
            }

            return driver.findElement(By.xpath(optionsMap[options['Razor_Type']])).click()
            
            //  TODO rest of action
        })

        .then(function(){
            return driver.sleep(5000)})


        .then(function(check) {

            return driver.findElement(By.xpath('/html/body/div[5]/div/main/section/div/table/tr/td/table/tr[2]/td/button[2]')).click()
      
        })


        .then(function(){
            return driver.sleep(10000)})

        .then(function() {
            return driver.getCurrentUrl();
        })
        .then(function(url){
            debug("Redirected to: " + url);
            if(url != 'https://www.dollarshaveclub.com/your-box/scheduled') {
                debug("Redirection Failed");
                throw new FatalError("Unknown");
            } 
        })


        // .then(function(){
        //     return driver.sleep(5000)})

        // .then(function() {

        //     optionMap={
        //         'The Humble Twin':'/html/body/div[5]/div/main/article/div/ul/li[1]/div/div[3]/div/button',
        //         'The 4x':'/html/body/div[5]/div/main/article/div/ul/li[2]/div/div[3]/div/button',
        //         'The Executive':'/html/body/div[5]/div/main/article/div/ul/li[3]/div/div[3]/div/button'
        //     }

        //     //  TODO if there's an option input here, build the map from input to the page, if not this is not necessary
        //     return driver.findElement(By.xpath('/html/body/div[5]/div/main/div[2]/section/div[2]/div[2]/div/a')).click()
            
        //     //  TODO rest of action
        // })

        //  Include these pieces in every step
        .then(function() {
            return driver.sleep(5000);
        })
    


        .then(function(){

            return driver})


        .catch(function(error){throw error});
      



}
















