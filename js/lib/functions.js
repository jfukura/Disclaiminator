/**
 * Simple date Class that returns a formatted date
 *
 * @returns {String} Date formatted as MM/DD/YYYY
 */
var DateNow = function () {

    var now = new Date(),
        day = ( "0" + now.getDate() ).slice( -2 ),
        month = ( "0" + ( now.getMonth() + 1 ) ).slice( -2 ),
        date = month + '/' + day + '/' + now.getFullYear();

    return date;

}


/**
 * Cookie Handler Function!
 *
 * @param  {String} action Store, Get or Destroy
 * @param  {String} name   Name that cookie
 * @param  {String} value  The stringified content for the cookie (consider B64)
 * @param  {Integer} days  Number of days to set for expiry of the cookie (optional)
 */
function cookieMonster ( action, name, value, days ) {

    'use strict';

    if ( action === 'store' ) {

        var expires = '';
        if ( days ) {

            var date = new Date();
            date.setTime( date.getTime() + ( days * 24 * 60 * 60 * 1000 ) );
            expires = "; expires=" + date.toGMTString();

        }
        document.cookie = name + "=" + value + expires;

    } else if ( action === 'get' ) {

        var nameEQ = name + "=",
            ca = document.cookie.split( ';' ),
            i,
            c;

        for( i = 0; i < ca.length; i += 1 ) {

            c = ca[i];
            while( c.charAt( 0 ) === ' ' ) {

                c = c.substring( 1, c.length );

            }
            if ( c.indexOf( nameEQ ) === 0 ) {

                return c.substring( nameEQ.length, c.length );

            }

        }

    } else if ( action === 'destroy' ) {

        var date = new Date();

        date.setTime( date.getTime() + ( -1 * 24 * 60 * 60 * 1000 ) );
        expires = "; expires=" + date.toGMTString();

        document.cookie = name + "=" + expires;

    }

}


function throbber ( action ) {

    if ( action === 'start' ) {

        var shade = $( '<div>', { class : 'shade mod-throbber', } );

        $( 'body' ).append( shade ).fadeTo( 250, 1 );

    } else {

        $( '.shade' ).fadeTo( 250, 0, function () {

            $( '.shade' ).remove();

        } );

    }

}


/* =========================================================================  */
/* DOWNLOADATRON                                                              */

/**
     * Downloadatron Constructor Function
     */
function Downloadatron () {

    this.name;              // Name of the file to download
    this.options = [];      // User selectable options (Word, JS, JSON)
    this.obj;               // The Disclaiminator Object
    this.content = '';      // Stringified content to place in the file

};


/**
     * Prepare the files for downloading
     *
     * @param  {Function} cb Callback function
     */
Downloadatron.prototype.prepare = function ( cb ) {

    var parent = this;
    var d = this.obj;   // Get the Disclaimer Model

    // Set some root level variables.  This is cutting a corner.
    d.projectData['PC'] = d.projectData.selectPC.PC;
    d.projectData['SID'] = d.projectData.selectPC.SID;

    var client = new XMLHttpRequest();
    // Get the disclaimer.js template file
    client.open( 'GET', 'templates/disclaimers.txt' );

    // TODO: Should change this to AJAX at some point to handle errors better
    client.onreadystatechange = function () {

        if ( client.readyState === 4 && client.status === 200 ) {

            var response = client.responseText;

            // Search for each of the handlebar'd variables and run the replace
            response = response.replace( /{{expiryDate}}|{{account}}|{{PC}}|{{SID}}|{{inputProjectName}}|{{inputProjectManager}}|{{inputTracking}}|{{inputPromo}}|{{inputPromoFund}}|{{CreatedDate}}|{{ModifiedDate}}|{{PROMOCODE}}|{{DISCLAIMERS}}/gi, function ( matched ) {
                // Look in the object for the variable to match (should
                // match the key of the object)
                var matchData = d.projectData[matched.replace( '{{', '' ).replace( '}}', '' )];
                var returnedData;

                // Be sure to stringify any object data that we come across
                if ( matchData !== null && typeof matchData === 'object' ) {

                    returnedData = JSON.stringify( matchData );

                } else {

                    returnedData = matchData;

                }
                return returnedData

            } );

            // Cache the filled out template
            this.content = response;

            // Callback
            cb( this );

        }

    }
    client.send();

}

/**
     * Download the files
     *
     * @param  {Object} responseObj Downloadatron Class Object
     * @return {[type]}             [description]
     */
Downloadatron.prototype.download = function ( responseObj ) {

    var d = model;                      // Get the Disclaiminator Model
    var response = responseObj.content; // The merged and saved template content
    var zip = new JSZip(),
        word, content;

    // Create the name for the files from the project name, replacing special
    // characters and spaces with a dash
    var name = d.projectData.inputProjectName.replace( /[^a-z0-9\s]/gi, '-' );

    // If we want the disclaimer.js file, add this to the zip
    if ( document.getElementById( 'downloadJS' ).checked ) {

        zip.file( 'disclaimer.js', response );

    }

    // If we want the JSON project file, add it to the zip
    if ( document.getElementById( 'downloadJSON' ).checked ) {

        var jsonFileName = "project_";
        if ( name !== "" ) {

            jsonFileName += name;

        }
        if ( d.projectData.TrackingCode !== undefined ) {

            jsonFileName += "_" + d.projectData.TrackingCode;

        }
        jsonFileName = jsonFileName.replace( /[^a-z0-9]/gi, '_' ).toLowerCase();
        jsonFileName += ".json";

        // Stringify the object
        zip.file( jsonFileName, JSON.stringify( d.projectData ) );

    }


    // If we want the Word Document, run some other junk
    if ( document.getElementById( 'downloadWord' ).checked ) {

        $.ajax( {
            type : 'GET',
            url : 'templates/DisclaimerProject.txt',
            cache : false,
            success : function ( data ) {
                // Not an elegant way to handle the multiple replaces, but it
                // works for now since we don't have that many.
                var content = $( '#disclaimers' ).html();
                data = data.replace( '{{projectName}}', model.projectData.inputProjectName );
                data = data.replace( '{{owner}}', model.projectData.inputProjectManager );
                data = data.replace( '{{date}}', model.projectData.modifiedDate );
                data = data.replace( '{{content}}', content );

                // Add the Word Document to the zip file
                zip.file( name + '.doc', data );

                // At the end of the async request, build the zip.  This could
                // be handled with a promise or some other method since we have
                // to call this again in an else statement.
                content = zip.generate( { type :"blob", } );
                saveAs( content, name + '.zip' );

            },
            complete : function ( response ) {

            },
        } );

    } else {
        // If we don't want the Word Document, we can just run the save without
        // going through more ajax headaches.
        content = zip.generate( { type :"blob", } );
        saveAs( content, name + '.zip' );

    }

};

/* END DOWNLOADATRON                                                          */
/* =========================================================================  */
