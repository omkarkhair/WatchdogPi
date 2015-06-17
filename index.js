var gpio = require("pi-gpio");
var mandrill = require('mandrill-api');
var config = require('config');

console.log(config);

// Setup mandrill
var mandrill_key = "GaBvOYll9O86XNat1R1vNA";
var mandrill_client = new mandrill.Mandrill(mandrill_key);

// Values we plan to move to config in coming versions
var pin = 11; // Set a GPIO Pin
var checkState = 0; // The state for you which you need a notifications. You can either be notified if the pin is open for too long, or closed.
var maxTimeout = 30000; // maximum time for which the state can remain locked in milliseconds.
var pollTime = 3000; // How often should we check the state, in milliseconds.


// Mandrill alert message
var message = {
    "html": "<p>Bow wow! Watchdog found the door open.</p>",
    "text": "Bow wow! Watchdog found the door open.",
    "subject": "Watchdog Pi Alert!",
    "from_email": "watchdog@example.com",
    "from_name": "Watchdog Pi",
    "to": [{
            "email": "sample@mail.com",
            "name": "Guardian",
            "type": "to"
        }],
    "headers": {
        "Reply-To": "watchdog@example.com"
    },
    "important": false,
    "track_opens": null,
    "track_clicks": null,
    "auto_text": null,
    "auto_html": null,
    "inline_css": null,
    "url_strip_qs": null,
    "preserve_recipients": null,
    "view_content_link": null,
    "tracking_domain": null,
    "signing_domain": null,
    "return_path_domain": null,
    "merge": true,
    "merge_language": "mailchimp",
    
};
var async = false;
var ip_pool = "Main Pool";
var send_at = new Date();
    
var timer = null;

// Alert routine
function sendAlert() {
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        console.log(result);
        
    }, function(e) {
        
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        
    });
}

var Status = {
    status : !checkState,
    updated : new Date(),
    alertSent: false,
    update : function () {
        gpio.read(pin, function(err, value){
            
            if (err)
            {
                console.log("Error reading pin:", err);
                return;
            }
            
            console.log("Polling value:", value);
            // check if state is open
            if ( this.status == checkState && value == checkState && !this.alertSent ) {
                // check if this has been for too long.
                if ( ( (new Date()) - this.updated ) > maxTimeout ) {
                    // Trigger notification
                    this.alertSent = true;
                    console.log("ALERT!!!");
                    sendAlert();
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

// Open the pin as INPUT and PULL-UP

gpio.close(pin, function(){

	gpio.open(pin, "input", function (err) {
    
    		if (err)
        		throw (err);
    
	    	console.log("Pin direction set. Starting polling at:", pollTime);
    		// Pin set as input -- start polling
    		timer = setInterval(Status.update, pollTime);
    
	});

});
