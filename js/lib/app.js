/**
* Constructors for Disclaimer and Disclaiminator
*/

// TODO: [Landing Page Constructor] Create partials for scripts needed in the project

var Disclaimer = function () {

        this.id = '';       // Programmatic name for the disclosure
        this.title = '';    // User friendly title of the disclosure
        this.content = '';  // HTML content for the disclosure
        this.attrs = [];    // Attributes that are used for filtering in the UI

    },
    Disclaiminator = function () {

        var _this = this;

        // _this.projectData = ko.observable( {} ); // An object from the index form
        _this.xmlUrl = 'xml/disclaimers.v2.xml';
        // _this.projectDisclaimers = ko.observableArray();

        _this.model = {
            projectData :{},
            Disclaimers :[],
        };    // This content will be saved out to the cookie for the user

        _this.disclaimers = {
            all          : [],    // Regular disclosures housed here as an array of objects
            placeholders : {
                bonusTime         : 1,
                bonusBusinessDays : 1,
                calendarDays      : 90,
                copyYear          : new Date().getFullYear(),
                leastMonths       : 9,
                leastMonths2      : 9,
                numberofTrades    : 1,
                // openDate          : '', // This needs to be the expiry date
                tradeDate         : '',
                tradeBusinessDays : 1,
                withdrawalDays    : 180,

                depositAmount     : 5000,
                depositAmount1    : 5000,
                depositAmount2    : 15000,
                depositAmount3    : 50000,
                depositAmount4    : 100000,
                depositAmount5    : 200000,

                bonusAmount       : 50,
                bonusAmount1      : 50,
                bonusAmount2      : 100,
                bonusAmount3      : 200,
                bonusAmount4      : 300,
                bonusAmount5      : 600,
            },
        };
        _this.expandedState = true; // When in the 'disclaimers' view expanded or collapsed view state
        _this.debug = false;

        _this.views = {
            setup : function () {

                var input = document.getElementsByClassName( 'js-input' ),
                        infields = document.getElementsByClassName( 'js-infield' );

                console.log( 'setup', _this.model )
                if ( _this.model.projectData.length !== 0 ) {

                    if ( _this.model.projectData.projectType === undefined ) {

                        $( 'body' ).append( '<div id="modal" class="modal"></div>' );

                        $( '#modal' ).load( 'views/modal.projectType.htm', function () {

                            $( '.projectType-item .target' ).on( 'click', function ( e ) {

                                e.preventDefault();

                                _this.model.projectData.projectType = this.dataset.type;

                                if ( this.dataset.type !== 'LP' ) {

                                    $( '.nav-item a[href="#tracking"]' ).parent().remove();

                                }

                                $( '#modal' ).fadeOut( 250, function () {

                                    $( this ).remove();

                                    throbber( 'destroy' );

                                } )

                            } );

                        } );

                    } else {

                        throbber( 'destroy' );

                        if ( _this.model.projectData.projectType === 'LP' ) {

                            console.log( 'not empty anymore' );
                            // TODO: update the navigation to reflect the need for a "scripts builder"

                        }

                    }

                    var keys = Object.keys( _this.model.projectData );

                    for( var i = 0; i < keys.length; i++ ) {

                        $( '#' + keys[i] ).val( _this.model.projectData[keys[i]] ).addClass( 'mod-filled' );

                        // If we returned an 'on,' this means we have a checkbox
                        // to deal with
                        if ( _this.model.projectData[keys[i]] === true || _this.model.projectData[keys[i]] === 'on' ) {

                            $( '#' + keys[i] ).attr( 'checked', true );

                        } else if ( keys[i] === 'selectPC' ) {

                            $( '#' + keys[i] ).find( 'option[value="' + _this.model.projectData[keys[i]].PC + '"]' ).prop( 'selected', true );

                        }

                    }

                }

                // For each input...
                for( var i = 0; i < input.length; i++ ) {

                    // Save the data after changing something
                    input[i].addEventListener( 'change', function ( el ) {

                        for( var x = 0; x < input.length; x++ ) {

                            if ( $( input[x] ).attr( 'id' ) === 'selectPC' && $( input[x] ).val() !== '' ) {

                                _this.model.projectData.selectPC = {};

                                _this.model.projectData.selectPC['PC'] = $( input[x] ).val();
                                _this.model.projectData.selectPC['SID'] = $( input[x] ).find( 'option:selected' ).attr( 'data-sid' );

                            } else if ( $( input[x] ).is( 'input[type="checkbox"]' ) ) {

                                _this.model.projectData[$( input[x] ).attr( 'id' )] = $( input[x] )[0].checked;

                            } else {

                                _this.model.projectData[$( input[x] ).attr( 'id' )] = $( input[x] ).val();

                            }

                        }

                        _this.validateForm( 'basic' );
                        _this.saveProject();

                    } );

                }

                // Check the form at start to see if it's already been filled
                _this.validateForm( 'basic' );

                // Start the infield label function
                $( infields ).infieldLabel();

                var note, opts = {
                    readAsDefault : "Text",
                    //accept: "json",
                    on            : {
                        beforestart : function ( e, file ) {

                            console.log( 'throbber start' );
                            // return false if you want to skip this file

                        },
                        load : function ( e, file ) {

                            var content = e.target.result;

                            try {

                                var obj = JSON.parse( content );

                                if ( !obj.projectData ) {

                                    console.log( 'no project data' );
                                    _this.model.Disclaimers = obj.Disclaimers ;
                                    _this.model.projectData = obj;

                                    _this.model.projectData.Disclaimers = null;

                                } else {

                                    _this.model = obj;

                                }

                                cookieMonster( 'store', 'COFI_DISC_JSON', JSON.stringify( _this.model ) );

                                note = new Notice( 'success', 'Project file was successfully loaded' );
                                note.pop();

                                _this.viewHandler( 'setup' );

                            } catch ( err ) {

                                note = new Notice( 'error', 'Something went wrong with the upload: ' + err );
                                note.pop();

                            }

                        },
                    },
                };

                $( "#UploadJson" ).fileReaderJS( opts );

            },
            disclaimers : function () {

                _this.searcher();

                if ( _this.model.projectData.length === 0 ) {

                    _this.getPage( 'setup' );

                } else {

                    // Foreach disclaimer in the model, we need to add it to the panel
                    // also need to look for disclosures that belong in the "selected bucket"

                    _this.fillDisclaimerBuckets();

                }

                throbber( 'destroy' );

                $( '#disclaimerExpandView' ).on( 'change', function () {

                    _this.expandedState = !_this.expandedState;

                } );

            },
            tracking : function () {

                _this.projectSticker();

                $( '.js-form-next' ).removeClass( 'disabled' );

                if ( _this.model.projectData.scripts !== undefined ) {

                    var keys = Object.keys( _this.model.projectData.scripts );

                    for( var i = 0; i < keys.length; i++ ) {

                        $( '#' + keys[i] ).attr( 'checked', _this.model.projectData.scripts[keys[i]] );

                    }

                    if ( _this.model.projectData.scripts.floodlightTag !== undefined ) {

                        $( '#floodlightTag' ).removeAttr( 'disabled' ).val( _this.model.projectData.scripts.floodlightTag );

                    }

                } else {

                    _this.model.projectData.scripts = {};

                }

                $( '.cmn-toggle, #floodlightTag' ).on( 'change', function () {

                    getSelected();

                } );

                function getSelected () {

                    var toggles = $( '.cmn-toggle' );

                    for( var i = 0; i < toggles.length; i++ ) {

                        _this.model.projectData.scripts[toggles[i].id] = toggles[i].checked;

                    }

                    if ( _this.model.projectData.scripts.floodlightSwitch === true ) {

                        $( '#floodlightTag' ).removeAttr( 'disabled' );

                        _this.model.projectData.scripts.floodlightTag = $( '#floodlightTag' ).val();

                    }

                    _this.saveProject();

                }

                throbber( 'destroy' );

            },
            finalize : function () {

                if ( _this.model.projectData.scripts ) {

                    var scriptKeys = Object.keys( _this.model.projectData.scripts );

                    for( var i = 0; i < scriptKeys.length; i++ ) {

                        if ( _this.model.projectData.scripts[scriptKeys[i]] === true && scriptKeys[i].replace( 'Switch', '' ) !== 'floodlight' ) {

                            var script = scriptKeys[i].replace( 'Switch', '' );

                            $.ajax( 'templates/' + script + '.txt' )

                                .success( function ( data, status, xhr ) {

                                    var req = this.url.replace( 'templates/', '' ).replace( '.txt', '' );

                                    scripts[scripts.mapping[req]] += data;

                                } );

                        } else if ( scriptKeys[i] === 'floodlightSwitch' && _this.model.projectData.scripts[scriptKeys[i]] === true ) {

                            scripts.header += _this.model.projectData.scripts.floodlightTag;

                        }

                    };
                };

                var scripts = {
                        mapping : {
                            floodlight  : 'header',
                            maxymiser   : 'header',
                            omniture    : 'footer',
                            remarketing : 'footer',
                        },
                        header  : '',
                        footer  : '',
                    },
                    down = new Downloadatron();

                    down.obj = _this.model;

                _this.projectSticker();
                _this.reviewDisclaimers();

                down.prepare();

                $( '#Download' ).on( 'click', function () {

                    throbber( 'start' );

                    down.headScripts = scripts.header;
                    down.footScripts = scripts.footer;

                    down.download();

                } );

                throbber( 'destroy' );
                // Preview the disclaimers
                // download stuff...

            }

        };

        // First, look for a cookie and set it to the model if it's found
        _this.setCookieToModel();

        // Grab all the disclaimers and stuff those into the model too
        _this.parseDisclaimerXml( _this.getPage );

        // Look for what navigation we need and build it
        _this.buildNav();


    };

Disclaiminator.prototype.projectSticker = function () {

    var _this = this,
        keys = Object.keys( _this.model.projectData );

    console.log( _this.model.projectData );

    for( var i = 0; i < keys.length; i++ ) {

        if ( $( '.' + keys[i], '#project-sticker' ).length > 0 ) {

            $( '.' + keys[i], '#project-sticker' ).html( _this.model.projectData[keys[i]] );

        }

    }

}

/**
* setCookieToModel Method
*
* First, look for a cookie => if found, set to model
* If no cookie, see if we are on the localhost => if true, set dummy data
*/
Disclaiminator.prototype.setCookieToModel = function () {

    var _this = this,
        cookie = cookieMonster( 'get', 'COFI_DISC_JSON' );

    if ( cookie ) {

        _this.model = JSON.parse( cookie );

    } else if ( window.location.host.indexOf( 'localhost' ) >= 0 ) {

        // Dummy content
        var obj = {
            inputProjectName    :"Project Name",
            inputProjectManager :"Owner Name",
            url                 :"https://content.capitaloneinvesting.com",
            createdDate         :"",
            modifiedDate        :"",
            inputTracking       :"01817-PWF",
            inputPromo          :"PRM1",
            inputPromoFund      :"PRMFND",
            adTrax              :"AD-15853541",
            expiryDate          :"12/31/2020",
            selectPC            :{
                PC  :"DS",
                SID :"DISPLAY_DEFAULT",
            },
            account             :"roth",
            bankMarketing       :"on",
        };

        // Set the content to the model
        _this.model.projectData = obj;

    }

};

Disclaiminator.prototype.buildNav = function () {

    var _this = this,
        steps = Object.keys( _this.views ),
        wizard = '';

    for( var i = 0; i < steps.length; i++ ) {

        wizard += '<li class="nav-item">' +
                '<a class="nav-item-target" href="#' + steps[i] + '">' +
                        steps[i] +
                    '</a>' +
            '</li>';

    }

    $( '#nav' ).append( wizard );

    $( '.nav-item', '#nav' ).on( 'click', function ( e ) {

        if ( $( this ).children().hasClass( 'is-done' ) ) {

            // If we have already visited a page, we can navigate to it
            _this.getPage( e.target.hash.replace( '#', '' ) );

        } else {

            e.preventDefault();

        }

    } );

    if ( _this.model.projectData.projectType ===  'Other' ) {

        $( '.nav-item-target[href="#tracking"' ).parent().remove();

    }
    _this.inputHandler();

};

Disclaiminator.prototype.getPage = function ( target, ths ) {

    var _this = this,
        view = 'setup';

    if ( ths ) {
        _this = ths;
    }

    if ( target !== undefined ) {

        view = target;

        _this.viewHandler( view );
        console.log('undefined')
    } else if ( window.location.hash ) {
        console.log('hash')
        view = window.location.hash.replace( '#', '' );
        _this.viewHandler( view );

    } else if ( window.location.pathname.indexOf('review.html') >= 0 ) {

        _this.reviewinator();
        console.log('this?')
        return false;

    } else {
        console.log('setup');

        _this.viewHandler( 'setup' );
    }


};

/**
* Base View Handler Function
*
* @param  {String} view :: The name of the view to get (name of partial)
*/
Disclaiminator.prototype.viewHandler = function ( view ) {

    var _this = this,
        $main = $( '#main' ),
        $curNav = $( '.nav-item-target[href="#' + view + '"]' ),
        navLength = document.getElementsByClassName( 'nav-item' );

    // Kick-off the throbber here, we don't kill it in this function because
    // there may be times where we want the throbber to keep running until after
    // all async processes have completed.
    throbber( 'start' );

    // Start the process of getting the view, first by handling the wrapper,
    // then load the view partial, finally tunning the view functions
    $main.fadeTo( 250, 0, function () {

        $main.load( 'views/' + view + '.htm', function () {

            _this.views[view]();

            $curNav.addClass( 'is-current is-done' );

            if ( $curNav.parent().index() >= 1 ) {

                for( var i = 0; i < $curNav.parent().index(); i++ ) {

                    $( navLength[i] ).children().addClass( 'is-done' );

                }

            }
            console.log( $( '.nav-item-target[href="#' + view + '"]' ).parent().index() );

            $main.fadeTo( 250, 1 );

        } );

    } );

};

Disclaiminator.prototype.reviewinator = function (  ) {

    var _this = this,
        $disclaimers = $( '#disc-source' );

    for ( var i = 0; i < _this.disclaimers.all.length; i++ ) {

        var item = fullTemplate( _this.disclaimers.all[i] );

        $disclaimers.append( item );

    }

    function fullTemplate ( obj ) {
        var html = obj.content.replace(/#_(.*)_#/g, '<span class="variable">VARIABLE</span>')
        var newLi = '<li class="disc-pool-item is-added" data-id="' + obj.id + '" data-filters="' + obj.attrs.join( ' ' ) + '">' +
                    '<div class="disc-pool-item-title">' + obj.title + '</div>' +
                    '<div class="disc-pool-item-content">' +
                        html +
                    '</div>' +
                '</li>';

        return newLi;

    }

    _this.searcher();


    $( '.js-list-download' ).on( 'click', function () {
                // Add it to the template, then download
        var client = new XMLHttpRequest();
        // Get the disclaimer.js template file
        client.open( 'GET', 'templates/DisclaimerList.txt' );

        // TODO: Should change this to AJAX at some point to handle errors better
        client.onreadystatechange = function () {

            if ( client.readyState === 4 && client.status === 200 ) {

                var response = client.responseText;

                response = response.replace('{{content}}', $( '#disc-source').html()).replace('{{date}}', DateNow());


                var zip = new JSZip(),
                    word, content;

                // Add the Word Document to the zip file
                zip.file( 'DisclaimerList.doc', response );

                // At the end of the async request, build the zip.  This could
                // be handled with a promise or some other method since we have
                // to call this again in an else statement.
                content = zip.generate( { type :"blob", } );

                saveAs( content, 'DisclaimerList' + '.zip' );

            }

        }
        client.send();
    } )

}

Disclaiminator.prototype.inputHandler = function () {

    var _this = this,
        note;

    // Nav bar inputs to handle
    // - Navigation
    // - Save
    // - Save and Next
    // - Clear

    $( '.js-form-save' ).on( 'click', function ( e ) {

        e.preventDefault();
        _this.disclaimerSaver();
        _this.saveProject();

        note = new Notice( 'success', 'Project Saved' );
        note.pop();

    } );
    $( '.js-form-next' ).on( 'click', function ( e ) {

        e.preventDefault();

        note = new Notice( 'success', 'Project Saved' );

        note.pop();

        var view = $( '.nav-item-target.is-current' )
            .removeClass( 'is-current' ).addClass( 'is-done' )
                .parent().next().children().attr( 'href' );

        window.location.hash = view;

        _this.getPage();

    } );

    $( '#cookie-clear' ).on( 'click', function () {

        var currView = window.location.hash.replace( '#', '' );
        var note = new Notice( 'warn', 'Disclaimer cookie has been cleared' );
        cookieMonster( 'destroy', 'COFI_DISC_JSON' );

        if ( currView === '' ) {

            currView = 'setup';

        }

        if ( currView === 'setup' ) {

            $( '#modal, .shade' ).remove();

            _this.model.projectData = {};
            _this.model.Disclaimers = {};

        } else if ( currView === 'disclaimers' ) {

            _this.model.Disclaimers = {};

        }

        _this.viewHandler( currView );

    } );

};

Disclaiminator.prototype.parseDisclaimerXml = function ( callback ) {

    var _this = this;
    var cb = callback;

    // BUG: Oh, hi.  This section probably is brokesauce.
    $.ajax( {
        type : 'GET',
        url : _this.xmlUrl,
        cache : false,
        success : function ( data ) {

            var $xml = $( data );
            var node = $xml.find( 'root' ).children();

            for( var i = 0; i < node.length; i++ ) {

                var item = node[i],
                    disclaimer = new Disclaimer();

                for( var a = 0; a < item.attributes.length; a++ ) {

                    var $attr = $( item.attributes[a] );

                    if ( $attr[0].name === 'name' ) {
                        // If the attribute name is "name," set that as the
                        // object's ID
                        disclaimer.id = $attr.val();

                    } else if ( $attr[0].name === 'title' ) {

                        // If the attribute name is "title," set that as the
                        // object's title
                        disclaimer.title = $attr.val();

                    } else {

                        // Push the object to the attrs array
                        disclaimer.attrs.push( $attr.val() );

                    }

                }

                disclaimer.content = $( item ).text().trim();

                // We are now pushing all disclosures into one array
                _this.disclaimers.all.push( disclaimer );

            }

        },
        complete : function ( response ) {

            if ( cb ) {

                cb( undefined, _this );

            }

            if ( response.status >= 200 && response.status < 300 ) {

                if ( debug.state === true ) {

                    console.log( ':: DEBUG :: NOTICE :: Returned ' + _this.disclaimers.all.length + ' Disclaimers' );

                }

                return response.status;

            } else {

                return response;

            }

        },

    } );

};

Disclaiminator.prototype.expandedViewHandler = function () {

    var _this = this;

    if ( _this.expandedState === true ) {

        $.each( $( '#disc-selected' ).find( 'li' ), function () {

            $( this ).find( '.disc-pool-item-title' ).hide();
            $( this ).find( '.disc-pool-item-content' ).show();

        } )

    } else {

        $.each( $( '#disc-selected' ).find( 'li' ), function () {

            $( this ).find( '.disc-pool-item-title' ).show();
            $( this ).find( '.disc-pool-item-content' ).hide();

        } );

    }

};

Disclaiminator.prototype.validateForm = function ( id ) {

    var _this = this,
        frm = $( '#' + id ),
        filled = 0,
        required = 0,
        inputs = $( '.input', frm );

    // First, find out how many inputs are required
    for( var i = inputs.length - 1; i >= 0; i-- ) {

        if ( inputs[i].attributes.required !== undefined && inputs[i].value !== '' ) {

            required++;
            filled++;

        } else if ( inputs[i].attributes.required !== undefined && inputs[i].value === '' ) {

            required++;

        }

    }

    console.log( 'NOTE: Validation method results - ' + filled + '/' + required + ' filled' );

    if ( filled === required ) {

        debug.msgs.push( 'NOTE: Form is valid, remove the disabled class' );
        $( '.js-form-next' ).removeClass( 'disabled' );

    }

};

Disclaiminator.prototype.saveProject = function () {

    var _this = this;

    // Save the model, then save a cookie from the model
    // Save to _this.projectData
    cookieMonster( 'store', 'COFI_DISC_JSON', JSON.stringify( _this.model ) );

    console.log( 'saveproject', _this.model );

};

Disclaiminator.prototype.fillDisclaimerBuckets = function () {

    var _this = this,
        disclaimers = _this.disclaimers.all,
        baseArray = [ 'CombinedCardBank', 'baseDisclaimer_1', 'baseDisclaimer_3', ],
        dids = [],
        ids = [],
        noDD = [ 'BrokerComparisonChart', 'marketRisk',
                'baseDisclaimer_1', 'baseDisclaimer_3',
                'baseDisclaimer_2', 'CombinedCardBank', 'bankMarketing', ];

    // This can be a private function
    function definePlaceholders ( raw ) {

        var reg = /\#\_[a-zA-Z0-9:]+\_\#/g,
            matches = [], found;

        while( found = reg.exec( raw ) ) {

            matches.push( found[0] );
            reg.lastIndex = found.index + 1;

        }
        matches.forEach( function ( str, i ) {

            var node;
            str = str.split( ':' );

            var key = str[1].replace( '_#', '' );

            if ( str[0].replace( '#_', '' ) === 'decimal' ) {

                var classes = 'variable';

                if ( _this.disclaimers.placeholders[key] !== undefined ) {

                    classes += ' is-filled';

                }
                node = '<input type="number" class="' + classes + '" data-id="' + str[1].replace( '_#', '' ) + '" value="' + _this.disclaimers.placeholders[key] + '"/>';

            } else if ( str[0].replace( '#_', '' ) === 'string' ) {

                var opts = '<option> </option>';
                if ( str[1].replace( '_#', '' ) === 'bonusTime' ) {

                    opts += '<option>5-7 business days</option><option>4-6 weeks</option>';

                } else if ( str[1].replace( '_#', '' ) === 'promoCode' || str[1].replace( '_#', '' ) === 'promoCodeFund' ) {
                    // TODO: Should be able to automatically put the promo codes in place...

                    if ( _this.model.projectData.inputPromo ) {

                        opts += '<option>' + _this.model.projectData.inputPromo + '</option>';

                    }
                    if ( _this.model.projectData.inputPromoFund ) {

                        opts += '<option>' + _this.model.projectData.inputPromoFund + '</option>';

                    }

                }

                node = '<select class="variable" data-id="' + str[1].replace( '_#', '' ) + '" value="' + _this.disclaimers.placeholders[key] + '">' +
                        opts +
                    '</select>';

            } else if ( str[0].replace( '#_', '' ) === 'date' ) {

                node = '<input type="text" class="variable datepicker" data-id="' + str[1].replace( '_#', '' ) + '" size="6" value=""/>';

            }

           raw = raw.replace( matches[i], node );

        } );

        return raw;

    }

    function previewItem () {

        $( '#disc-source .disc-pool-item' ).on( 'mouseenter', function ( e ) {

            if ( e.type === 'mouseenter' ) {

                var id = $( this ).attr( 'data-id' );
                $.each( _this.disclaimers.all, function ( i,o ) {

                    if ( o.id === id ) {

                        var wrap = '<div class="previewOverlay">' + o.content + '</div>';
                        $( '.previewContainer' ).fadeIn( 250 ).empty().append( wrap );

                        return false;

                    }

                } );

            }

        } );

        $( '#disc-source' ).on( 'mouseleave', function () {

            $( '.previewContainer' ).fadeOut( 250 ).empty();

        } );

    }

    function annotationDD () {

        'use strict';
        //select drop down used by disclaimers
        var annotation = $( '<select></select>' ).attr( 'class', 'input-mini annotation' ),
            i;

        annotation.append( '<option value=""></option>' );
        for( i = 1; i < 10; i += 1 ) {

            annotation.append( "<option>" + i + "</option>" );

        }
        annotation.append( "<option>*</option>" );
        annotation.append( "<option>**</option>" );
        annotation.append( "<option>***</option>" );
        annotation.append( "<option>&dagger;</option>" );
        annotation.append( "<option>&dagger;&dagger;</option>" );
        annotation.append( "<option>&Dagger;</option>" );
        annotation.append( "<option>&Dagger;&Dagger;</option>" );
        annotation.append( "<option>#</option>" );
        annotation.append( "<option>##</option>" );
        annotation.append( "<option>||</option>" );
        annotation.append( "<option>&Delta;</option>" );
        annotation.append( "<option>&loz;</option>" );

        return annotation[0].outerHTML;

    }

    function fullTemplate ( obj ) {

        var html = definePlaceholders( obj.content ),
            newLi = '',
            dd = '';

        if ( noDD.indexOf( obj.id ) < 0 ) {

            dd = annotationDD();

        }

        newLi = '<li class="disc-pool-item is-added" data-id="' + obj.id + '" data-filters="' + obj.attrs.join( ' ' ) + '">' +
                    dd +
                    '<div class="disc-pool-item-title">' + obj.title + '</div>' +
                    '<div class="disc-pool-item-content">' +
                        html +
                    '</div>' +
                    '<a href="javascript:void(0);" class="disc-pool-item-remove delete">&times;</a>' +
                '</li>';

        return newLi;

    }

    function variableHandler () {

        $( '.datepicker' ).datepicker();

        $( '.variable' ).on( 'change', function () {

            var dataId = $( this ).attr( 'data-id' ),
                dataVal = $( this ).val();

            $( '.variable[data-id="' + dataId + '"]' ).addClass( 'is-filled' ).val( dataVal );

            _this.disclaimerSaver();

        } )

    }

    if ( _this.model.projectData.bankMarketing === true ) {

        baseArray.splice( 0, 0, 'bankMarketing' );

    }

    // Three options:
    // - If we have a cookie -> do everything off of the cookie
    // - If we don't and bank marketing is on -> setup the base disclosures for RNIP
    // - If we don't and bank marketing is off -> setup base disclosures for not RNIP

    // Grab the brokercheck disclosure
    for( var i = 0; i < disclaimers.length; i++ ) {

        if ( disclaimers[i].id === 'brokerCheck' ) {

            var broker = '<div data-id="' + disclaimers[i].id + '">' +
                    disclaimers[i].content +
                '</div>';

            // Prepend the proper parent element with the HTML
            $( '.drop-bucket.mod-prepend' ).prepend( broker );

        }

    }

    // Build the list of disclosures to pull from
    for( var i = 0; i < disclaimers.length; i++ ) {

        var disclaimer = disclaimers[i],
            template = '<li class="disc-pool-item" data-id="' + disclaimer.id + '" data-filters="' + disclaimer.attrs.join( ' ' ) + '">' +
                    disclaimer.title +
                '</li>';

        dids.push( disclaimer.id );

        $( '#disc-source' ).append( template );

    }

    if ( _this.model.Disclaimers.length > 0 ) {

        for( var a = 0; a < _this.model.Disclaimers.length; a++ ) {

            for( var i = 0; i < disclaimers.length; i++ ) {

                if ( disclaimers[i].id === _this.model.Disclaimers[a].id ) {

                    var $targetDisclaimer;

                    $( '#disc-selected' ).append( fullTemplate( disclaimers[i] ) );

                    $targetDisclaimer = $( '.disc-pool-item[data-id="' + disclaimers[i].id + '"]' , '#disc-selected' );

                    if ( _this.model.Disclaimers[a].ann !== undefined ) {

                        // Set the annotation to value
                        $targetDisclaimer.find( '.annotation' ).val( _this.model.Disclaimers[a].ann );

                    }

                    if ( _this.model.Disclaimers[a].variables !== undefined ) {

                        var modelVariables = _this.model.Disclaimers[a].variables,
                            variableKeys = Object.keys( _this.model.Disclaimers[a].variables );

                        for( var v = 0; v < variableKeys.length; v++ ) {

                            $targetDisclaimer.find( '.variable[data-id="' + variableKeys[v] + '"]' )
                                .addClass( 'is-filled' )
                                .val( modelVariables[variableKeys[v]].replace( /,/g , '' ) );

                        }

                    }

                }

            }

        }

    } else {

        // Start by reviewing the baseArray so that we get them in the right order
        for( var a = 0; a < baseArray.length; a++ ) {

            console.log( baseArray );
            for( var i = 0; i < disclaimers.length; i++ ) {

                if ( disclaimers[i].id === baseArray[a] ) {

                    $( '#disc-selected' ).append( fullTemplate( disclaimers[i] ) );

                }

            }

        }

    }

    // Initialize the draggable/sortable
    $( '#disc-source' ).find( '.disc-pool-item' ).draggable( {
        connectToSortable : '#disc-selected',
        helper : 'clone',
        revert : 'invalid',
        containment : '#holder',
        opacity : 1,
        create : function () {

            if ( debug.state === true ) {

                // console.log( ':: DEBUG :: NOTICE :: Draggable initiated' );

            }

        },
        start : function () {

            $( '.drop-bucket.mod-target' ).addClass( 'is-active' );

        },
        stop : function () {

            $( '.drop-bucket.mod-target' ).removeClass( 'is-active' );

        },
    } );

    $( '#disc-selected' ).sortable( {
        revert : true,
        opacity : 0.3,
        axis : 'y',
        forcePlaceholderSize : true,
        placeholder : 'sortable-placeholder',
        beforeStop : function ( event, ui ) {

            var array = ui.item[0].classList.value.split( ' ' );

            if ( array.indexOf( 'is-added' ) < 0 ) {

                var id = ui.item[0].dataset.id;

                for( var i = 0; i < _this.disclaimers.all.length; i++ ) {

                    if ( _this.disclaimers.all[i].id === id ) {

                        var disclaimer = _this.disclaimers.all[i];

                        ui.item[0].outerHTML = fullTemplate( disclaimer );

                    }

                }

            }

        },
        receive : function ( event, ui ) {

            $( ui.item ).addClass( 'added' );

        },
        stop : function ( event, ui ) {

            variableHandler();
            _this.expandedViewHandler();
            _this.disclaimerSaver();

            $( '.disc-pool-item-remove' ).on( 'click', function () {

                var $disclaimer = $( this ).closest( '.disc-pool-item' );

                $disclaimer.remove();

                $( '[data-id="' + $disclaimer.attr( 'data-id' ) + '"]' ).removeClass( 'added' );

            } );

        },
        create : function () {

            _this.expandedViewHandler();
            _this.disclaimerSaver();
            variableHandler();

            $( '#disclaimerExpandView' ).on( 'change', function () {

                _this.expandedViewHandler();

            } );

        },
    } );

    previewItem();

};

Disclaiminator.prototype.reviewDisclaimers = function () {

    var _this = this,
        d = _this.model;

    function Offer () {

        this.local          = false;

        if ( window.location.host.indexOf( 'localhost' ) >= 0 ) {

            this.local      = true;

        } else if ( window.location.host.indexOf( 'gitub' >= 0 ) ) {

            this.local      = 'github'

        }

        this.promoCode      = _this.model.projectData.inputPromo;
        this.promoCodeFund  = _this.model.projectData.inputPromoFund;
        this.disclaimers    = _this.model.Disclaimers;

        var x = getUrlVars();

        if ( x.xcode !== undefined ) {

            var xcode = '*' + x.xcode.toUpperCase();

            this.promoCode.promoCode += xcode;
            this.promoCode.fundCode  += xcode;

        }

        if ( this.local === true ) {

            this.baseUrl    = 'http://localhost:8888/';

        } else if ( this.local === 'github' ) {

            this.baseUrl    = 'https://github.kdc.capitalone.com/pages/cofi-brand-marketing/app-disclaiminator/';

        } else {

            this.baseUrl    = 'https://content.capitaloneinvesting.com/mgdcon/jump/app/disclaiminator/';

        }

        function getUrlVars () {

            var vars = [], hash,
                hashes = window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ).split( '&' );

            for( var i = 0; i < hashes.length; i++ )
            {

                hash = hashes[i].split( '=' );
                vars.push( hash[0] );
                vars[hash[0]] = hash[1];

            }
            return vars;

        }

    }
    Offer.prototype.setup = function () {

        var off = this;
        var headHTML = document.getElementsByTagName( 'head' )[0].innerHTML;
        var promoCodeEl = document.getElementsByClassName( 'promoCode' );
        var fundCodeEl = document.getElementsByClassName( 'fundCode' );

        headHTML += '<link rel="stylesheet" href="' + off.baseUrl + 'css/disclaimers.css" >';

        document.getElementsByTagName( 'head' )[0].innerHTML = headHTML;

        // TODO: This could be optimized further...
        for( var i = promoCodeEl.length - 1; i >= 0; i-- ) {

            promoCodeEl[i].innerHTML = off.promoCode.promoCode;

        }

        for( var i = fundCodeEl.length - 1; i >= 0; i-- ) {

            fundCodeEl[i]

        }

        off.requestDisclaimers();

    };

    Offer.prototype.requestDisclaimers = function () {

        var off = this;
        var xmlUrl = off.baseUrl + "xml/disclaimers.v2.xml";
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {

            if ( this.readyState == 4 && this.status == 200 ) {

                var root = this.responseXML.childNodes[0];
                var disclaimerArray = root.getElementsByTagName( 'disclaimer' );
                var container = document.getElementById( 'disclaimers' );

                for( var n = 0, l = off.disclaimers.length; n < l; n++ ) {

                    var currSel = off.disclaimers[n];

                    for( var i = disclaimerArray.length - 1; i >= 0; i-- ) {

                        var XMLdisc = disclaimerArray[i];
                        var XMLdiscName = XMLdisc.attributes.name.value;
                        var currSelName = currSel.id;
                        var html, vars, ann, footnote = '';

                        if ( XMLdiscName === currSelName && XMLdiscName !== 'blank' ) {

                            var node = document.createElement( 'SPAN' );
                            html = $( XMLdisc ).text();
                            $( node ).addClass( currSelName );

                            if ( currSel.ann !== undefined ) {

                                ann = currSel.ann;
                                footnote = '<sup class="footnote">' + ann + '</sup>';

                            }

                            if ( currSel.variables !== undefined ) {

                                vars = currSel.variables;
                                Object.keys( vars ).forEach( function ( key, i ) {

                                    var regEx = new RegExp( "<span class=\'" + key + "\'>(.*?)<\/span>", "gm" );

                                    html = html.replace( regEx, "<span class='" + key + "'>" + vars[key] + "<\/span>" );

                                } );

                            }

                            container.appendChild( node ).insertAdjacentHTML( 'afterbegin', html );
                            node.firstElementChild.insertAdjacentHTML( 'afterbegin', footnote );

                        } else if ( XMLdiscName === currSelName && XMLdiscName === 'blank' ) {

                            var blankSet = currSel[currSelName];

                            for( var b = 0, sl = blankSet.length; b < sl; b++ ) {

                                var node = document.createElement( 'SPAN' );

                                html = currSel[currSelName][b][Object.keys( currSel[currSelName][b] )].content;
                                ann = currSel[currSelName][b][Object.keys( currSel[currSelName][b] )].ann;

                                if ( ann !== undefined ) {

                                    footnote = '<sup class="footnote">' + ann + '</sup>';

                                }

                                container.appendChild( node ).insertAdjacentHTML( 'afterbegin', decodeURIComponent( html ) );
                                node.insertAdjacentHTML( 'afterbegin', footnote );

                            }

                        }

                    }

                }

                for( var i = disclaimerArray.length - 1; i >= 0; i-- ) {

                    if ( disclaimerArray[i].attributes.name.value === 'brokerCheck' ) {

                        var parent = document.getElementById( 'disclaimers' );
                        var node = document.createElement( 'SPAN' );

                        node.innerHTML = $( disclaimerArray[i] ).text();

                        parent.insertBefore( node, parent.childNodes[0] );

                    }

                }

            }

        };
        xhttp.open( "GET", xmlUrl, true );
        xhttp.send();

    };

    var offer = new Offer();
    offer.setup();

}

Disclaiminator.prototype.disclaimerSaver = function () {

    var _this = this,
        vars,
        selected = $( '.disc-pool-item', '#disc-selected' ),
        varCount = 0,
        varFilled = 0;

    for( var i = 0; i < selected.length; i++ ) {

        vars = $( selected[i] ).find( '.variable' );

        for( var v = 0; v < vars.length; v++, varCount++ ) {

            if ( $( vars[v] ).hasClass( 'is-filled' ) ) {

                varFilled++;

            }

        }

    }

    if ( varCount === varFilled ) {

        $( '.js-form-next' ).removeClass( 'disabled' );
        save();

    } else {

        $( '.js-form-next' ).addClass( 'disabled' );

    }

    function save () {

        var array = [];

        // Go through each disclaimer
        // get ID
        // get Variables
        //      get Variable ID
        //      get Variable Value

        // Don't empty the model until we know we have everything

        for( var i = 0; i < selected.length; i++ ) {

            var obj = {
                id : $( selected[i] ).attr( 'data-id' ),
            }

            vars = $( selected[i] ).find( '.variable' );

            if ( vars.length > 0 ) {

                obj.variables = {};

                for( var v = 0; v < vars.length; v++ ) {

                    var val = $( vars[v] ).val();

                    if ( vars[v].type === 'number' && vars[v].dataset.id !== 'copyYear' ) {

                        val = vars[v].value.toString().replace( /\B(?=(\d{3})+(?!\d))/g, "," );

                    }
                    console.log( val );

                    obj.variables[ $( vars[v] ).attr( 'data-id' ) ] = val;

                }

            }

            if ( $( '.annotation', selected[i] ).val() !== undefined ) {

                obj.ann = $( '.annotation', selected[i] ).val();

            }

            array.push( obj );

        }

        if ( array.length > 0 ) {

            _this.model.Disclaimers = array;
            _this.saveProject();

        }

    }

}

// TODO: Fix all of this stuff
Disclaiminator.prototype.searcher = function () {

    var timer = null;
    var _this = this;

    // When the user changes a filter dropdown, run the comparison
    $('.js-filter-select').on('change', function () {
        filterCompare();
    });

    // Prepare to search while the user is typing
    $('.js-filter-text').keyup(function(e){
        if(e.which === 13) {
            clearTimeout(timer);
            filterCompare();
        }
        $('.js-filter-clear').addClass('is-visible');

        // If the timer has started, clear it (keep the search from running
        // too often)
        if(timer) {
            clearTimeout(timer);
        }

        // Start the timer, then if time runs out, run the comparison script
        timer = setTimeout(function () {
            filterCompare();
        }, 500);
    });

    // When you click the little x in the search box, clear everything and, once
    // again, run the comparison script
    $('.js-filter-clear').on('click', function () {
        $(this).hide();
        $('.js-filter-text').val('');
        filterCompare();
    });

    // When you click the "clear filters" button, clear everything and then run
    // the comparison script to clean things up
    $('.js-filter-clear-all').on('click', function () {
        $('.js-filter-clear').hide();
        $('.js-filter-text, .js-filter-select').val('');

        filterCompare();
    });


    /**
     * The heart and soul of the search functions.  We need to gather the filters
     * that have been selected (if any have been selected), and check the search
     * text input field for a keyword.  In the future, we should probably create
     * an array of keywords and check against an array of words in the text
     */
    function filterCompare () {
        // Dropdown filters

        var filterArr = [],
            itemFilters,
            _this = this,
            curr;

        // Check the filter dropdowns for selected values, add them to an array
        $('.js-filter-select').each(function () {
            if($(this).find('option:selected').val().length > 0){
                filterArr.push($(this).find('option:selected').val());
            }
        });

        $('#disc-source').find('.disc-pool-item').each(function () {
            curr = $(this).data('id');
            itemFilters = $(this).data('filters').split(' ');

            // Check to see if any of the selected filters match for this item
            var fltr = superbag(itemFilters, filterArr);

            if(fltr === true) {

                // If the filter matches, move to the next step (check keyword)
                var searchText = $('.js-filter-text').val().toLowerCase();
                var text = $('#disc-source').find('.disc-pool-item[data-id="' + curr + '"]').text().toLowerCase();

                // model.disclaimers.discSet.forEach(function (v, i) {
                //     if (model.disclaimers.discSet[i].id === curr) {
                //         text += model.disclaimers.discSet[i].content.toLowerCase();
                //     }
                // });

                if(text !== '' && text.indexOf(searchText) >= 0 ) {

                    // If the search text matches text within this item, remove the
                    // filter on the item
                    $('#disc-source').find('.disc-pool-item[data-id="' + curr + '"]').removeClass('filter-out');
                } else {

                    // Otherwise, let's filter this item out
                    $('#disc-source').find('.disc-pool-item[data-id="' + curr + '"]').addClass('filter-out');
                }
            } else {

                // There aren't any text filters that match, so let's just hide this
                $('#disc-source').find('.disc-pool-item[data-id="' + curr + '"]').addClass('filter-out');
            }
        });

        // Find all of the items that need to be filtered out, and hide them
        $('.filter-out').slideUp(250);

        // Find the ones that aren't filtered out, and show them
        $('#disc-source>li').not('.filter-out').slideDown(250);

        visibleCounter( $('#disc-source>li').not('.filter-out').length, $('#disc-source>li').length )

    };

    function visibleCounter( left, total ) {

        $( '.data.mod-left', '#itemCounter' ).text( left );

        $( '.data.mod-total', '#itemCounter' ).text( total );

    }


    /**
     * Check the two arrays for matches, return the total number of matches, or,
     * return false.
     *
     * @param  {Array} sup - Array of filters for the specific disclaimer item
     * @param  {Array} sub - Array of filters selected from the dropdowns
     * @return {Bool}      - Are there matches found or not?
     */
    function superbag (sup, sub) {
        sup.sort();
        sub.sort();
        var i, j;

        for (i=0,j=0; i<sup.length && j<sub.length;) {
            if (sup[i] < sub[j]) {
                ++i;
            } else if (sup[i] == sub[j]) {
                ++i; ++j;
            } else {
                // sub[j] not in sup, so sub not subbag
                return false;
            }
        }
        // make sure there are no elements left in sub
        return j == sub.length;
    };
}

/* =========================================================================  */
/* DOWNLOADATRON                                                              */

/**
     * Downloadatron Constructor Function
     */
function Downloadatron () {

    var _this = this;

    _this.name;              // Name of the file to download
    _this.options = [];      // User selectable options (Word, JS, JSON)
    _this.obj;               // The Disclaiminator Object
    _this.content = '';      // Stringified content to place in the file
    _this.headScripts = '';
    _this.footScripts = '';

};


/**
     * Prepare the files for downloading
     *
     * @param  {Function} cb Callback function
     */
Downloadatron.prototype.prepare = function () {

    var _this = this;
    var d = _this.obj;   // Get the Disclaimer Model
    console.log( 'download', _this );

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
            response = response.replace( /{{expiryDate}}|{{account}}|{{PC}}|{{SID}}|{{inputProjectName}}|{{inputProjectManager}}|{{inputTracking}}|{{inputPromo}}|{{inputPromoFund}}|{{CreatedDate}}|{{ModifiedDate}}|{{PROMOCODE}}/gi, function ( matched ) {
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

            response = response.replace( '{{Disclaimers}}', JSON.stringify( d.Disclaimers ) );

            // Cache the filled out template
            _this.content = response;

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
Downloadatron.prototype.download = function () {

    var _this = this;
    var d = _this.obj;                      // Get the Disclaiminator Model
    var response = _this.content; // The merged and saved template content
    var zip = new JSZip(),
        word, content;

    console.log( _this )
    // Create the name for the files from the project name, replacing special
    // characters and spaces with a dash
    var name = d.projectData.inputProjectName.replace( /[^a-z0-9\s]/gi, '-' );

    throbber( 'start' );

    zip.file( 'header.partial.html', _this.headScripts );
    zip.file( 'footer.partial.html', _this.footScripts );
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
        zip.file( jsonFileName, JSON.stringify( d ) );

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
                data = data.replace( '{{projectName}}', _this.obj.projectData.inputProjectName );
                data = data.replace( '{{owner}}', _this.obj.projectData.inputProjectManager );
                data = data.replace( '{{date}}', _this.obj.projectData.modifiedDate );
                data = data.replace( '{{content}}', content );

                // Add the Word Document to the zip file
                zip.file( name + '.doc', data );

                // At the end of the async request, build the zip.  This could
                // be handled with a promise or some other method since we have
                // to call this again in an else statement.
                content = zip.generate( { type :"blob", } );

                saveAs( content, name + '.zip' );

            },
        } );

    } else {
        // If we don't want the Word Document, we can just run the save without
        // going through more ajax headaches.
        content = zip.generate( { type :"blob", } );

        saveAs( content, name + '.zip' );

    }

};
/* =========================================================================  */

/**
* Kick off the application on a window load event
*/
window.onload = function () {

    var d = new Disclaiminator();

};
