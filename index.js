var gpio = require("pi-gpio");

// Values we plan to move to config in coming versions
var pin = 13;
var checkState = 0; // The state for you which you need a notifications. You can either be notified if the pin is open for too long, or closed.
var maxTimeout = 30000; // maximum time for which the state can remain locked in milliseconds.
var pollTime = 3000; // How often should we check the state, in milliseconds.

var timer = null;

var Status = {
    status : !checkState,
    updated : new Date(),
    alertSent: false,
    update : function () {
        gpio.read(pin, function(value){
        
            // check if state is open
            if ( this.status == checkState && value == checkState && !this.alertSent ) {
                // check if this has been for too long.
                if ( ( (new Date()) - this.updated ) > maxTimeout ) {
                    // Trigger notification
                    this.alertSent = true;
                    console.log("ALERT!!!");
                }
            }
            else if (this.alertSent){
                console.log("Reseting alert");
                this.alertSent = false;
            }
            
            // Set the state
            this.status = value;
            this.updated = new Date();

            
        });
    }
}

// Start doing stuff
gpio.setDirection(pin, in, function (err) {
    
    if (err)
        throw (err);
    
    // Pin set as input -- start polling
    timer = setInterval(Status.update, pollTime);
    
});