var gpio = require("pi-gpio");

// Values we plan to move to config in coming versions
var pin = 16;
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
            console.log("Polling value:", value);
            // check if state is open
            if ( this.status == checkState && value == checkState && !this.alertSent ) {
                // check if this has been for too long.
                if ( ( (new Date()) - this.updated ) > maxTimeout ) {
                    // Trigger notification
                    this.alertSent = true;
                    console.log("ALERT!!!");
                }
            }
            else if (this.alertSent && this.status != checkState){
                console.log("Reseting alert");
                this.alertSent = false;
            }

            // check if pin state is changing
            if ( this.status != value ) {
                this.updated = new Date();
            }
            // Set the state
            this.status = value;

            
        });
    }
}

// Start doing stuff
gpio.setDirection(pin, "input", function (err) {
    
    if (err)
        throw (err);
    
    console.log("Pin direction set. Starting polling at:", pollTime);
    // Pin set as input -- start polling
    timer = setInterval(Status.update, pollTime);
    
});
