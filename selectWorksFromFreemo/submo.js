// MODULE VARIABLES /////////////////////////////////////////////////
const _ = require('lodash');
const debug = require('debug')('submo');
const Subscription = require('../models/subscription');
const User = require('../models/user');
const Queue = require('../models/queue');
const {FatalError, RetriableError} = require('./errors.js');
const {ACTION, STATE} = require('./status.js');
const {QUEUE_ACTION} = require('./queue_action.js');
// Pending time before updateStatus will kick off another
// query in milliseconds
const pendingExpiry = 1800000; // 30 minutes

// EXPORTS //////////////////////////////////////////////////////////

// TODO handle as much db interaction as possible - leave only
// subscription interfacing to the drivers - handle parsing
// for user/pass, updating user/pass, updating account status, etc.
// for fast driver development and testing

// TODO all account changes should follow the pattern:
// submit action, on success
// update account sub status history to pending with target state & timestamp
// kick off getStatus for the account/sub change

// IF the web server ever encounters a pending with some time limit exceeded,
// re kick getStatus to refresh

// maybe credentials object (we may need more than user pass)

// Gets the list of available subscriptions as a list of objects
exports.getSubscriptions = async function() {
    return loadConfiguration() .then(
        ({subMap, driverMap}) => subMap);
}

// Given a subscription ID, returns the subscription object
// Returns null if the subscription does not exist
exports.getSubscription = function(sub) {
    return loadConfiguration().then(
        ({subMap, driverMap}) => subMap.get(sub));
}

// Gets the status of the subscription for user uid
// also updates the account status in mongodb if pending
exports.updateStatus = function(sub, uid, force = false) {
    debug("Updating status...");
    return User.findById(uid).exec().then(user => {
        debug("User " + uid + " found");
        let subObj = user.getSub(sub, true);
        let latestStatus = user.getLatestStatus(sub);
        if(!latestStatus){
            throw new Error("User " + uid + " is not subscribed to " + sub);
        }
        // If the pending action is expired, kick off an update
        if(latestStatus.action != ACTION.PENDING){
            debug("Latest action was not pending, aborting");
            return latestStatus;
        } else if (!force && Date.now() - latestStatus.time < pendingExpiry){
            debug("Latest pending update was too soon and force not specified");
            return latestStatus;
        } else {
            debug("Retrieving and updating status for " + uid + ":" + sub);
            // Refresh the pending timestamp
            latestStatus.time = Date.now();
            user.save();
            // Extract sub credentials and get status
            let {username, password} = user.getCredentialsForSub(sub);
            let pStatus = loadConfiguration().then(
                ({subMap, driverMap}) => callDriver(driverMap.get(sub)[0],
                (driver) => driver.getStatus(username, password)));
            // On status retrieval success, update the subscription to
            // the returned status.
            pStatus.then((status)=> {
                debug("getStatus succeeded, updating");
                // If the latest state was link OR
                // if the newly retrieved status matches the pending status,
                // we confirm the status
                // Otherwise, pending failed and we update accordingly
                if( STATE.LINK === latestStatus.state
                    || (status.state === latestStatus.state 
                    && _.isEqual(status.options, latestStatus.options))){
                    debug("Update Status succeeded");
                    debug("State " + latestStatus.state + " confirmed");


                    // Action succeeded
                    user.pushStatus(sub, {action: ACTION.CONFIRMED,
                        state: status.state, options: status.options});
                } else {
                    debug("Update Status failed");
                    debug("State " + latestStatus.state + " failed");
                    // Action failed
                    user.pushStatus(sub, {action: ACTION.FAILED, 
                        error: "Expected [" + JSON.stringify(latestStatus) 
                        + "] found [" + JSON.stringify(status) + "]"});
                }
                user.save();
            }).catch(error => {
                debug("Error updating status for sub " + sub 
                + " for user " + uid + ":" + error);
            });
        }
        // Regardless, we return latest status
        return latestStatus;
    }, error => {
        throw new Error("Attempting to get status for nonexistent id " + uid);
    });
}

// Given a subscription and user credentials, attempts to link the account.
// Credentials will default to email / master password if left empty
// Returns once the link request has been recorded
exports.linkAccount = function(sub, uid, optUsername, optPassword) {
    debug("Linking Account...");
    return User.findById(uid).exec().then(user => {
        debug("User " + uid + " found");
        let subObj = user.getSub(sub, true);
        let latestStatus = user.getLatestStatus(sub);
        if(latestStatus && latestStatus.action === ACTION.PENDING){
            throw new Error("Account is pending " + latestStatus.STATE);
        }
        // Update the mongo db state to pending link
        subObj.username = optUsername;
        subObj.password = optPassword;
        user.pushStatus(sub, {action: ACTION.PENDING, state: STATE.LINK});
        let {username, password} = user.getCredentialsForSub(sub);
        let pUpdate = user.save();
        // On update success, begin linking
        debug("Calling drivers");
        pUpdate.then(() => {
            // Linking account
            let pLink = loadConfiguration().then(
                ({subMap, driverMap}) => callDriver(driverMap.get(sub)[0],
                (driver) => driver.linkAccount(username, password)));
            pLink.then(success => {
                debug("Link Account succeeded");
                // Retrieve and update the status of the account
                exports.updateStatus(sub, uid, true);
            }, error => {
                debug("Link Account failed");
                // Append failed link with error
                user.pushStatus(sub, {action: ACTION.FAILED, state: STATE.LINK, error: error.message});
                user.save().then(() => {debug("Added failure to history")});
            });
        });
        return pUpdate;
    }, error => {
        throw new Error("Attempting to link account for nonexistent id " + uid);
    });
}

// Signs up a user id for the subscription, credentials will default
// to email and master password if left empty
// Throws an error on failure

exports.signUp = function(sub, uid, optUsername, optPassword, options,cvv) {

    

    debug("Signing Up...");
    return User.findById(uid).exec().then(user => {
        debug("User " + uid + " found");
        let subscription = user.getSub(sub, true);
        let latestStatus = user.getLatestStatus(sub);

        let profile = user.profile;
        let address = user.address_info;
        let payment = user.getBilling(cvv);

            
        if(latestStatus){
            throw new Error("Account already exists");
        }
        // Update the mongo db state to pending active (state after sign up)
        subscription.username = optUsername;
        subscription.password = optPassword;

        subscription.history.push({action: ACTION.PENDING, state: STATE.ACTIVE, options: options});

        let {username, password} = user.getCredentialsForSub(sub);
        let pUpdate = user.save();
        // On update success, begin signup
        debug("Calling drivers");
        pUpdate.then(() => {
            // Signing up account
            let pSignUp = loadConfiguration().then(
                ({subMap, driverMap}) => callDriver(driverMap.get(sub)[0],
                (driver) => driver.signUp(username, password, options, profile, address, payment, cvv)));
            pSignUp.then(success => {
                debug("Sign Up succeeded");
                setupQueue(uid, sub, subscription.OfferLength);
                // Retrieve and update the status of the account
                exports.updateStatus(sub, uid, true);
            }, error => {
                debug("Sign Up failed");
                // Append failed signup with error
                subscription.history.push(
                    {action: ACTION.FAILED, state: STATE.ACTIVE, error: error.message});
                user.save();
            });
        });
        return pUpdate;
    }, error => {
        throw new Error("Attempting to sign up for nonexistent id " + uid);
    });
}

function setupQueue(user, sub, trial_length){

    let rating_date = new Date();
    rating_date.setDate(rating_date.getDate()+3);

    var rating = new Queue({
      userID : user,
      subID : sub,
      actionID: QUEUE_ACTION.RATING,
      date: rating_date
    });
  
    rating.save()
  
    let cancel_remind_date = new Date();
    cancel_remind_date.setDate(cancel_remind_date.getDate() + trial_length - 3)

    var cancel_remind = new Queue({
      userID : user,
      subID : sub,
      actionID: QUEUE_ACTION.REMINDER,
      date: cancel_remind_date
    });
  
    cancel_remind.save()
    
    let cancel_confirm_date = new Date();
    cancel_confirm_date.setDate(cancel_confirm_date.getDate() + trial_length)
  
    var cancel_confirm = new Queue({
      userID : user,
      subID : sub,
      actionID: QUEUE_ACTION.CANCELLATION,
      date: cancel_confirm_date
    });
  
    cancel_confirm.save()

}

// Given a subscription and a user ID, activate the subscription
// Throws an error on failure
exports.activate = function(sub, uid) {
    debug("Activating...");
    return User.findById(uid).exec().then(user => {
        debug("User " + uid + " found");
        let subscription = user.getSub(sub);
        let latestStatus = user.getLatestStatus(sub);
        if(!latestStatus){
            throw new Error("Account does not exist");
        }
        if(latestStatus.action === ACTION.PENDING){
            throw new Error("Account is pending " + latestStatus.STATE);
        }
        if(user.getCurrentStatus(sub).state === STATE.ACTIVE){
            throw new Error("Account is already active");
        }
        let {username, password} = user.getCredentialsForSub(sub);
        // Update the mongo db state to pending active
        user.pushStatus(sub, {state: STATE.ACTIVE, action: ACTION.PENDING});
        let pActivate = user.save();
        // On update success, begin activate
        debug("Calling drivers");
        pActivate.then(() => {
            // Signing up account
            let pSignUp = loadConfiguration().then(
                ({subMap, driverMap}) => callDriver(driverMap.get(sub)[0],
                (driver) => driver.activate(username, password)));
            pSignUp.then(success => {
                debug("Activate succeeded");
                // Retrieve and update the status of the account
                exports.updateStatus(sub, uid, true);
            }, error => {
                debug("Activate failed");
                // Append failed activate with error
                user.pushStatus(sub, {action: ACTION.FAILED, error: error.message});
                user.save();
            });
        });
        return pActivate;
    }, error => {
        throw new Error("Attempting to sign up for nonexistent id " + uid);
    });
}

// Given a subscription and a user ID, deactivate the subscription
// Throws an error on failure
exports.deactivate = function(sub, uid) {
    debug("Deactivating...");
    return User.findById(uid).exec().then(user => {
        debug("User " + uid + " found");
        let subscription = user.getSub(sub);
        let latestStatus = user.getLatestStatus(sub);
        if(!latestStatus){
            throw new Error("Account does not exist");
        }
        if(latestStatus.action === ACTION.PENDING){
            throw new Error("Account is pending " + latestStatus.STATE);
        }
        if(user.getCurrentStatus(sub).state === STATE.INACTIVE){
            throw new Error("Account is already inactive");
        }
        let {username, password} = user.getCredentialsForSub(sub);
        // Update the mongo db state to pending inactive
        user.pushStatus(sub, {state: STATE.INACTIVE, action: ACTION.PENDING});
        let pDeactivate = user.save();
        // On update success, begin deactivate
        debug("Calling drivers");
        pDeactivate.then(() => {
            // Signing up account
            let pSignUp = loadConfiguration().then(
                ({subMap, driverMap}) => callDriver(driverMap.get(sub)[0],
                (driver) => driver.deactivate(username, password)));
            pSignUp.then(success => {
                debug("Deactivate succeeded");
                // Retrieve and update the status of the account
                exports.updateStatus(sub, uid, true);
            }, error => {
                debug("Deactivate failed");
                // Append failed deactivate with error
                user.pushStatus(sub, {action: ACTION.FAILED, state: STATE.INACTIVE, error: error.message});
                user.save();
            });
        });
        return pDeactivate;
    }, error => {
        throw new Error("Attempting to sign up for nonexistent id " + uid);
    });
}

// Sets sub options for user uid
// Throws an error on failure
exports.setOptions = function(sub, uid, options) {
    debug("Setting options...");
    return User.findById(uid).exec().then(user => {
        debug("User " + uid + " found");
        let subscription = user.getSub(sub);
        let latestStatus = user.getLatestStatus(sub);
        if(!latestStatus){
            throw new Error("Account does not exist");
        }
        if(latestStatus.action === ACTION.PENDING){
            throw new Error("Account is pending " + latestStatus.STATE);
        }
        if(user.getCurrentStatus(sub).options === options){
            throw new Error("Account options already set");
        }
        let {username, password} = user.getCredentialsForSub(sub);
        // Update the mongo db state to pending the same state
        user.pushStatus(sub, {options: options, action: ACTION.PENDING});
        let pSetOptions = user.save();
        // On update success, begin set options
        debug("Calling drivers");
        pSetOptions.then(() => {
            // Signing up account
            let pSignUp = loadConfiguration().then(
                ({subMap, driverMap}) => callDriver(driverMap.get(sub)[0],
                (driver) => driver.setOptions(username, password, options)));
            pSignUp.then(success => {
                debug("Set Options succeeded");
                // Retrieve and update the status of the account
                exports.updateStatus(sub, uid, true);
            }, error => {
                debug("Set Options failed");
                // Append failed set options with error
                user.pushStatus(sub, {action: ACTION.FAILED, options: options, error: error.message});
                user.save();
            });
        });
        return pSetOptions;
    }, error => {
        throw new Error("Attempting to sign up for nonexistent id " + uid);
    });
}

// HELPERS AND SETUP ////////////////////////////////////////////////

// Calls the subscription action with function, falling through
// until success or no more drivers
// If driver throws a FatalError, we exit with failure
// If driver throws a RetriableError, we move onto the next driver
// If driver returns non null, we succeeded
async function callDriver(driver, action) {
    if(driver == null){
        console.error("Action not handled by any drivers");
        return null;
    }
    if(driver.enabled){
        return action(driver.driver).then(success => {
            return success;
        }, error => {
            debug(error);
            if(error instanceof FatalError){
                throw error;
            } else if(error instanceof RetriableError){
                return callDriver(driver.next, action);
            } else {
                throw error;
            }
        });
    } else {
        return callDriver(driver.next, action);
    }
}

// Validates that a driver has the required methods
// throws error on invalid driver
function validateDriver(driver) {
    // TODO
}

// Loads all subscription information and passes to callback
async function loadConfiguration(){
    debug("Loading configuration");
    let subscriptionMap = new Map();
    let driverMap = new Map();
    let query = Subscription.find({});
    return query.exec().then(function(subscriptions){ 
        subscriptions.forEach(function(subscription){
            let sub = subscription.ID
            // Load subscription information
            debug("Adding subscription: ");
            debug(subscription);
            subscriptionMap.set(sub, subscription._doc);
            // Load drivers
            let prevDriver = null;
            driverMap.set(sub, []);
            subscription.Drivers.forEach(function({Name, Enabled}){
                debug(`Loading driver ${Name} for subscription ${sub}, `
                    + `enabled [${Enabled}]`);
                // Add module to driver map
                let path = `./subscriptions/${sub}/${Name}.js`;
                debug(`Reading path ${path}`);
                try {
                    let driver = require(path)
                    validateDriver(driver);
                    let d = {driver: driver, enabled: Enabled}
                    driverMap.get(sub).push(d);
                    // Link the previous driver to this oen via next
                    if(prevDriver) {
                        prevDriver.next = d;
                    }
                    prevDriver = d;
                    debug("Loaded driver");
                }
                catch (error) {
                    console.error(`Unable to load driver ${error}`);
                }
            });
        });
        debug("Loaded configuration");
        return {subMap: subscriptionMap, driverMap: driverMap};
    });
}