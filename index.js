var gpio = require("pi-gpio");
var mandrill = require('mandrill-api');
var config = require('config');

var http = require("http");

//console.log(config);

// debug server
var port = 1337;
var poll_count = 0;
// Setup mandrill
var mandrill_key = config.get('mandrill-key');

var mandrill_client = new mandrill.Mandrill(mandrill_key);
// Values we plan to move to config in coming versions
var pin = config.get('pin'); // Set a GPIO Pin
var checkState = config.get('alertValue'); // The state for you which you need a notifications. You can either be notified if the pin is open for too long, or closed.
var maxTimeout = config.get('maxTimeOut'); // maximum time for which the state can remain locked in milliseconds.
var pollTime = config.get('pollTime'); // How often should we check the state, in milliseconds.

var fromEmail = config.get('emailFrom');
var toEmail = config.get('emailTo');

var emailText = config.get('emailText');
var emailSubject = config.get('emailSubject');

// Mandrill alert message
var message = {
    "html": "<p>"+emailText+"</p>",
    "text": emailText,
    "subject": emailSubject,
    "from_email": fromEmail,
    "from_name": "Watchdog Pi",
    "to": [{
            "email": toEmail,
            "name": "Guardian",
            "type": "to"
        }],
    "headers": {
        "Reply-To": fromEmail
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
	poll_count++;
        gpio.read(pin, function(err, value){
            
            if (err)
            {
                console.log("Error reading pin:", err);
                return;
            }
            
            console.log("Polling value:", value);
            // check if state is open
            if ( Status.status == checkState && value == checkState && !Status.alertSent ) {
                // check if this has been for too long.
                if ( ( (new Date()) - Status.updated ) > maxTimeout ) {
                    // Trigger notification
                    Status.alertSent = true;
                    console.log("ALERT!!!");
                    sendAlert();
                }
            }
            else if (this.alertSent && this.status != checkState){
                console.log("Reseting alert");
                Status.alertSent = false;
            }

            // check if pin state is changing
            if ( Status.status != value ) {
                Status.updated = new Date();
            }
            // Set the state
            Status.status = value;

            
        });
    }
}

// Open the pin as INPUT and PULL-UP

function initPin () {
gpio.close(pin, function(err){
	//if (err) console.log(err);
        //console.log("Opening PIN");
	gpio.open(pin, "input", function (err) {
    		
    		if (err) {
			setTimeout(initPin, 5000);
			return;
		}
        		//throw (err);
    
	    	console.log("Pin direction set. Starting polling at:", pollTime);
    		// Pin set as input -- start polling
    		timer = setInterval(Status.update, pollTime);
    
	});

});
}

http.createServer(function (req, res) {
	res.writeHead(200, { "Content-Type": "text/html" });
	res.end("Watchdog Pi running: Door is " + ((Status.status == checkState) ? "Open" : "Closed") + ". Poll count:" + poll_count.toString());
	//res.end("Test");
}).listen(port);

initPin();
