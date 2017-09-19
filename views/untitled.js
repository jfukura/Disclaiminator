/**
 * The Constructor for each Disclaimer we are viewing in the tool
 */
var Disclaimer = function () {
    this.id = '';       // Programmatic name for the disclosure
    this.title = '';    // User friendly title of the disclosure
    this.content = '';  // HTML content for the disclosure
    this.attrs = [];    // Attributes that are used for filtering in the UI
}

/**
 * Simple date function that returns a formatted date
 *
 * @returns {String} Date formatted as MM/DD/YYYY
 */
var DateNow = function () {
    var now = new Date(),
        day = ("0" + now.getDate()).slice(-2),
        month = ("0" + (now.getMonth() + 1)).slice(-2),
        date = month + '/' + day + '/' + now.getFullYear();

    return date;
}

/**
 * Disclaiminator's models are housed here
 *
 * @type {Object}
 */
var model = {
    form: {
        selector: '',
        ckie: '',
        inputs: []
    },
    authState: true,
    npa: '43ed95ca5874d20670a054bef6869391',
    xmlUrl: 'xml/disclaimers.v2.xml',
    projectData: {},    // This content will be saved out to the cookie for the user
    disclaimers: {
        discSet: [],    // Regular disclosures housed here as an array of objects
        placeholders: {
            'bonusTime': 1,
            'bonusBusinessDays': 1,
            'calendarDays': 90,
            'copyYear': new Date().getFullYear(),
            'leastMonths': 9,
            'leastMonths2': 9,
            'numberofTrades': 1,
            'openDate': '',
            'tradeDate': '',
            'tradeBusinessDays': 1,
            'withdrawalDays': 180,

            'depositAmount': 5000,
            'depositAmount1': 5000,
            'depositAmount2': 15000,
            'depositAmount3': 50000,
            'depositAmount4': 100000,
            'depositAmount5': 200000,

            'bonusAmount': 50,
            'bonusAmount1': 50,
            'bonusAmount2': 100,
            'bonusAmount3': 200,
            'bonusAmount4': 300,
            'bonusAmount5': 600
        }
    },
    expandedState: true // When in the 'disclaimers' view > expanded or collapsed view state
}

/**
 * The Controller for Disclaiminator
 * @type {Object}
 */
var controller = {
    /**
     * Start me up.  This is the initializer for the Disclaiminator
     */
    init: function () {
        // Run a quick authentication check
        controller.authenticate.check();

        // Prepare all of the buttons that we are using
        $('.nav-item-target').on('click', function (event) {
            event.preventDefault();
            var view = $(this).attr('data-id');
            controller.view(view);
        });
        $('.js-form-save').on('click', function (event) {
            event.preventDefault();
            var note = new Notice('success', 'Project Saved');
            note.pop();
        });
        $('.js-form-next').on('click', function (event) {
            event.preventDefault();
            var note = new Notice('success', 'Project Saved');
            note.pop();
            var view = $('.nav-item-target.is-current').parent().next().children().attr('data-id');
            controller.view(view);
        });
        $('#cookie-clear').on('click', function () {
            var currView = $('.nav-item-target.is-current').attr('data-id');
            var note = new Notice('warn', 'Disclaimer cookie has been cleared');
            controller.clearCookie();
            controller.view(currView);
        });
    },
    /**
     * Working indicator for the user
     * We need to somehow show the user that we're working on their request,
     * this just opens a "shade" element with a background GIF
     *
     * @param  {String} action Name of the action we want to take
     */
    throbber: function (action) {
        if (action === 'start') {
            var shade = $('<div>', {class: 'shade mod-throbber'});

            $('body').append(shade).fadeTo(250, 1);
        } else {
            $('.shade').fadeTo(250, 0, function () {
                $('.shade').remove();
            });
        }
    },
    // Series of Authentication functions
    authenticate: {
        /**
         * Check if we have authenticated
         * Look for the auth cookie, and set the model with the cookie contents
         */
        check: function () {
            if (controller.cookieMonster('get', 'COFI_DISC_AUTH')) {
                // Found the cookie, get the data, save it and go to Index
                var obj = JSON.parse(controller.cookieMonster('get', 'COFI_DISC_AUTH'));
                model.authState = true;
                // if (obj.login !== undefined) {
                //     api.auth = obj.login;
                //     api.uid = obj.id;
                // } else {
                //     api.active = false;
                // }

                controller.view('index');
            } else {
                // No cookie found, go to the Login view
                // model.authState = false;
                controller.view('index');
            }
        },
        /**
         * Run the authentication actions (hit the API)
         */
        run: function () {
            // As long as we have a value we will go.  We should really check both
            // fields and do it better than this.
            if ($('#js-auth-name').val() !== '') {
                // Set the API auth model to the Base64 encoded auth string we need
                // api.auth = btoa($('#js-auth-name').val() + ':' + $('#js-auth-pass').val());
                // Run the PWFaction controller for authentication
                // PWFaction.auth();
            } else {
                // Fill in the form already.
                var note = new Notice('error', 'Please enter your user name and password');
            }
        },
        nonPWF: {
            setup: function () {
                $('#login-form').fadeTo(250,0, function () {
                    var html = '<input id="js-auth-spass" type="password" class="input mod-block js-infield" data-label="Password">' +
                        '<button class="btn btn-action" onclick="controller.authenticate.nonPWF.run($(\'#js-auth-spass\').val())">Login</button>';

                    $('#login-form').empty();
                    $('#login-form').append(html);
                    $('.js-infield').infieldLabel();
                    $('#login-form').fadeTo(250,1);
                })
            },
            run: function (value) {
                var attempt = CryptoJS.MD5(value).toString();

                if (attempt === model.npa) {
                    controller.view('index');
                    var obj = {type: 'nonPWF'};
                    controller.cookieMonster('store', 'COFI_DISC_AUTH', JSON.stringify(obj));
                    // api.active = false;
                } else {
                    var note = new Notice('error', 'Please check your password');
                    note.pop();
                }
            }
        }
    },
    /**
     * Cookie Handler!
     *
     * @param  {String} action Store, Get or Destroy
     * @param  {String} name   Name that cookie
     * @param  {String} value  The stringified content for the cookie (consider B64)
     * @param  {Integer} days  Number of days to set for expiry of the cookie (optional)
     */
    cookieMonster: function (action, name, value, days) {
        'use strict';

        if (action === 'store') {
            var expires = '';
            if (days) {
                var date = new Date();
                date.setTime(date.getTime()+(days*24*60*60*1000));
                expires = "; expires="+date.toGMTString();
            }
            document.cookie = name + "=" + value + expires;
        } else if (action === 'get') {
            var nameEQ = name + "=",
                ca = document.cookie.split(';'),
                i,
                c;

            for (i = 0; i < ca.length; i += 1) {
                c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
        } else if (action === 'destroy') {
            var date = new Date();

            date.setTime(date.getTime()+(-1*24*60*60*1000));
            expires = "; expires="+date.toGMTString();

            document.cookie = name + "=" + expires;
        }
    },
    form: {
        init: function () {
            model.form.inputs = [];
             $.each($('.js-input'), function () {
                model.form.inputs.push(this);
             });

            // if (api.active === true) {
            //     $('#inputProjectManager').val(JSON.parse(controller.cookieMonster('get', 'COFI_DISC_AUTH')).name);
            // }
            if (controller.cookieMonster('get', model.form.ckie)) {
                var obj = JSON.parse(controller.cookieMonster('get', model.form.ckie));

                console.log(obj);

                $.each(obj, function (key, val) {

                    if (key === 'bankMarketing' && val === 'on') {
                        $('#bankMarketing').prop('checked', true);
                    } else if (key === 'selectPC') {

                        $('#selectPC').find('option[value="' + obj.selectPC.PC + '"]').prop('selected', true);
                    } else {
                        $('.js-input[name="' + key + '"]').val(val);
                    }
                });
                controller.form.validate();
                controller.form.save();
            }

            $('.js-input').on('change', function () {
                controller.form.save();
                controller.form.validate();
            });
        },
        save: function () {

            $('.js-input').each(function () {
                var key = $(this).attr('name');
                var val = $(this).val();


                if (key === 'selectPC' && val !== '') {
                    model.projectData.selectPC = {};

                    model.projectData.selectPC['PC'] = val;
                    model.projectData.selectPC['SID'] = $(this).find('option:selected').attr('data-sid');
                } else {
                    if (key === 'bankMarketing') {
                        if ($(this).prop('checked') === true) {
                            val = 'on';
                        } else {
                            val = 'off';
                        }
                    }
                    model.projectData[key] = val;
                }

                model.projectData["id"] = model.projectData.inputProjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                model.projectData["url"] = model.projectData.url;
                model.projectData["test"] = "js/disclaimer.js";

            });
            controller.cookieMonster('store', model.form.ckie, JSON.stringify(model.projectData));
        },
        validate: function () {
            var frm = model.form;
            var filled = 0;
            var required = 0;

            for (var i = frm.inputs.length - 1; i >= 0; i--) {
                if (frm.inputs[i].attributes.required !== undefined && frm.inputs[i].value !== '') {
                    required++;
                    filled++;
                } else if (frm.inputs[i].attributes.required !== undefined && frm.inputs[i].value === '') {
                    required++;
                }

            }

            console.log('NOTE: Validation method results - ' + filled + '/' + required + ' filled');

            if (filled === required) {
                debug.msgs.push('NOTE: Form is valid, remove the disabled class');
                $('.js-form-next').removeClass('disabled');
            }
        }
    },
    disclaimers: {
        /**
         * Parse the Disclaimer XML file
         *
         * Get all of the disclaimers currently in the XML file (database).
         * Look for a returned 200.  If a 4xx or 5xx is returned, we need to give
         * the user some kind of message.
         *
         * @return {Integer/Object} Status Code on success, object on failure
         */
        init: function () {

        },
        parseXML: function (callback) {
            $.ajax({
                type: 'GET',
                url: model.xmlUrl,
                cache : false,
                success: function (data) {
                    var $xml = $(data);
                    var node = $xml.find('root').children();

                    node.each(function (i, v) {

                        // Create a new instance of the Disclaimer Object
                        var disclaimer = new Disclaimer();

                        // For each of the attributes...
                        $.each(this.attributes, function (i, a) {

                            if (a.name === 'name') {
                                // If the attribute name is "name," set that as the
                                // object's ID
                                disclaimer.id = a.value;

                            } else if (a.name === 'title') {

                                // If the attribute name is "title," set that as the
                                // object's title
                                disclaimer.title = a.value;

                            } else {

                                // Push the object to the attrs array
                                disclaimer.attrs.push(a.value);

                            }
                            disclaimer.content = $(v).text();
                        });

                        // We are now pushing all disclosures into one array
                        model.disclaimers.discSet.push(disclaimer);
                    });

                    if (debug.state === true) {
                        console.log(':: DEBUG :: NOTICE :: Returned ' + model.disclaimers.discSet.length + ' Disclaimers');
                    }
                },
                complete: function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        callback();
                        return response.status;
                    } else {
                        callback();
                        return response;
                    }
                }
            });
        },
        template: function (obj) {
            var html = controller.disclaimers.definePlaceholders(obj.content),
                // dropDown = controller.disclaimers.annotationDD(),
                newLi = '<li class="disc-pool-item" data-id="' + obj.id + '" data-filters="' + obj.attrs.join(' ') + '">' +
                        '<div class="disc-pool-item-title">' + obj.title + '</div>' +
                        '<div class="disc-pool-item-content">' +
                            html +
                        '</div>' +
                        '<a href="javascript:void(0);" class="disc-pool-item-remove delete">&times;</a>' +
                    '</li>';

            return newLi;
        },
        setBase: function (arr) {
            for (var a = 0; a < arr.length; a++) {
                for (var i = 0; i < model.disclaimers.discSet.length; i++) {
                    if (model.disclaimers.discSet[i].id === arr[a]) {
                        var item = controller.disclaimers.template(model.disclaimers.discSet[i]);

                        $('#disc-selected').append(item);

                        if (model.expandedState === true) {
                            $('#disc-selected').find('li[data-id="' + model.disclaimers.discSet[i].id + '"]').find('.disc-pool-item-title').hide();
                        } else {
                            $('#disc-selected').find('li[data-id="' + model.disclaimers.discSet[i].id + '"]').find('.disc-pool-item-title').show();
                            $('#disc-selected').find('li[data-id="' + model.disclaimers.discSet[i].id + '"]').find('.disc-pool-item-content').hide();
                        }
                    }
                }
            }
        },
        fillBuckets: function () {
            var modelDisc = model.disclaimers;
            var dids, ids;

            // Three options:
            // - If we have a cookie -> do everything off of the cookie
            // - If we don't and bank marketing is on -> setup the base disclosures for RNIP
            // - If we don't and bank marketing is off -> setup base disclosures for not RNIP

            for (var i = 0; i < model.disclaimers.discSet.length; i++) {
                if (model.disclaimers.discSet[i].id === 'brokerCheck') {
                    var broker = '<div data-id="' + model.disclaimers.discSet[i].id + '">' +
                            model.disclaimers.discSet[i].content +
                        '</div>';

                        // Prepend the proper parent element with the HTML
                        $('.drop-bucket.mod-prepend').prepend(broker);
                }
            }

            // If we have a cookie stored, we need to get the data from it.
            if (controller.cookieMonster('get', 'COFI_DISC_JSON') !== undefined) {
                console.log('cookie');
                var cookie = JSON.parse(controller.cookieMonster('get', 'COFI_DISC_JSON'));
                var projDiscs = cookie.projectData.Disclaimers;

                dids = [];
                modelDisc.discSet.forEach(function (obj) {
                    dids.push(obj.id);
                });

                ids = [];

                // For each of the ids in the array, check all of the disclaimers...
                projDiscs.forEach(function (v,i) {
                    ids.push(v.id);
                });

                var noDD = [
                        'BrokerComparisonChart', 'marketRisk',
                        'baseDisclaimer_1', 'baseDisclaimer_3',
                        'baseDisclaimer_2', 'CombinedCardBank', 'bankMarketing'
                    ];

                for (var i = 0; i < ids.length; i++) {
                    if($.inArray(ids[i], dids) >= 0) {
                        var selId = ids[i];

                        modelDisc.discSet.forEach(function (obj) {
                            console.log('this')
                            if (obj.id === selId) {

                                var dropDown = controller.disclaimers.annotationDD();
                                var newLi = controller.disclaimers.template(obj);

                                $('#disc-selected').append(newLi);

                                $('.disc-pool-item[data-id="' + obj.id + '"]').each(function (o, el) {
                                    if (projDiscs[i].variables) {
                                        $(el).find('.variable').each(function (v, param) {
                                            var varId = $(param).data('id');
                                            var objVars = projDiscs[i].variables;
                                            if (objVars[varId]) {
                                                $(el).find('[data-id="' + varId + '"]').each(function () {
                                                    $(this).val(objVars[varId].replace(',', ''));
                                                });
                                            }

                                        });
                                    }
                                });


                                if (noDD.indexOf(obj.id) < 0) {
                                    $('#disc-selected')
                                    .find('.disc-pool-item[data-id="' + obj.id + '"]')
                                    .find('.disc-pool-item-content')
                                        .children(':first').prepend(dropDown);
                                }


                                if (projDiscs[i].ann) {
                                    $('#disc-selected').find('.disc-pool-item[data-id="' + obj.id + '"]').find('.annotation').val(projDiscs[i].ann);
                                }
                                controller.disclaimers.inputChange();
                                controller.disclaimers.removeFromSelected();
                            }

                            // Initialize date picker
                            $('.datepicker').datepicker();

                            // Show the items have been filled in
                            if ($('.datepicker').val() !== '') {
                                $('.datepicker').addClass('is-filled');
                            }

                            $('select').each(function () {
                                if ($(this).val() !== '') {
                                    $(this).addClass('is-filled');
                                }
                            });
                        });

                        if (model.expandedState === true) {
                            $('#disc-selected').find('li[data-id="' + selId + '"]').find('.disc-pool-item-title').hide();
                        } else {
                            $('#disc-selected').find('li[data-id="' + selId + '"]').find('.disc-pool-item-title').show();
                            $('#disc-selected').find('li[data-id="' + selId + '"]').find('.disc-pool-item-content').hide();
                        }
                    }
                }
            } else if (model.projectData.bankMarketing === 'on') {
                var arr = ['bankMarketing', 'CombinedCardBank', 'baseDisclaimer_1', 'baseDisclaimer_3'];

                controller.disclaimers.setBase(arr);
                controller.disclaimers.removeFromSelected();
            } else {
                var arr = ['marketRisk', 'baseDisclaimer_1', 'baseDisclaimer_3'];

                controller.disclaimers.setBase(arr);
                controller.disclaimers.removeFromSelected();
            }

            $('#disc-selected').sortable({
                revert: true,
                opacity: 0.7,
                axis: 'y',
                receive: function(event, ui){
                    var id = ui.item[0].dataset.id;
                    var dropDown = controller.disclaimers.annotationDD();
                    var removeIcon = '<a href="javascript:void(0);" class="disc-pool-item-remove delete">&times;</a>';

                    if(ui.item.attr('data-id') !== 'blank') {
                        ui.item.addClass('added');
                    }

                    if (id !== 'blank') {
                        model.disclaimers.discSet.forEach(function (v, i) {
                            if (model.disclaimers.discSet[i].id === id) {
                                var html = '<div class="disc-pool-item-title">' + model.disclaimers.discSet[i].title + '</div>' +
                                    '<div class="disc-pool-item-content">' + controller.disclaimers.definePlaceholders(model.disclaimers.discSet[i].content) + '</div>';

                                $('#disc-selected').find('li[data-id="' + id + '"]').html(html)
                                    .children('.disc-pool-item-content').children(':first');

                                if (model.disclaimers.discSet[i].id !== 'BrokerComparisonChart') {
                                    $('#disc-selected').find('li[data-id="' + id + '"]')
                                        .children('.disc-pool-item-content').children(':first').prepend(dropDown);
                                }

                                $('#disc-selected').find('li[data-id="' + id + '"]').append(removeIcon);
                            }
                        });
                    }

                    if (model.expandedState === true) {
                        $('#disc-selected').find('li[data-id="' + id + '"]').find('.disc-pool-item-title').hide();
                    } else {
                        $('#disc-selected').find('li[data-id="' + id + '"]').find('.disc-pool-item-title').show();
                        $('#disc-selected').find('li[data-id="' + id + '"]').find('.disc-pool-item-content').hide();
                    }

                    if ($('.datepicker') !== undefined) {
                        $('.datepicker').datepicker({
                            onClose: function(dateText, inst) {
                                var parent = $(this).parent('span').attr('class');

                                $('.' + parent).find('input[data-id="' + parent + '"]').val(dateText)
                                    .addClass('is-filled');
                            }
                        });
                    }
                    controller.disclaimers.removeFromSelected();

                },
                stop: function(event, ui) {
                    controller.disclaimers.inputChange();

                    controller.disclaimers.selectDisclaimer();

                }
            });


            modelDisc.discSet.forEach(function (obj) {
                var newLi;

                if ($.inArray(obj.id, ids) < 0) {

                    // Create the HTML node
                    newLi = '<li class="disc-pool-item" data-id="' + obj.id + '" data-filters="' + obj.attrs.join(' ') + '">' +
                            obj.title +
                        '</li>';

                    // Append the HTML to the source container for the disclaimers

                } else {
                    newLi = '<li class="disc-pool-item added" data-id="' + obj.id + '" data-filters="' + obj.attrs.join(' ') + '">' +
                            obj.title +
                        '</li>';
                }
                $('#disc-source').append(newLi);
            });

            $('#disc-source').find('.disc-pool-item').draggable({
                connectToSortable: '#disc-selected',
                helper: 'clone',
                revert: 'invalid',
                containment: '#holder',
                opacity: 1,
                create: function () {
                    if (debug.state === true) {
                        console.log(':: DEBUG :: NOTICE :: Draggable initiated');
                    }
                },
                start: function () {
                    $('.drop-bucket.mod-target').addClass('is-active');
                },
                stop: function () {
                    $('.drop-bucket.mod-target').removeClass('is-active');

                }
            });
            controller.disclaimers.saveProgress();
            controller.disclaimers.previewItem();
        },
        definePlaceholders: function (raw) {
            var reg = /\#\_[a-zA-Z0-9:]+\_\#/g;
            var matches = [], found;

            while (found = reg.exec(raw)) {
                matches.push(found[0]);
                reg.lastIndex = found.index+1;
            }
            matches.forEach(function (str, i) {
                var node;
                str = str.split(':');

                var key = str[1].replace('_#', '');

                if (str[0].replace('#_', '') === 'decimal') {
                    var classes = 'variable';

                    if (model.disclaimers.placeholders[key] !== undefined) {
                        classes += ' is-filled';

                    }
                    node = '<input type="number" class="' + classes + '" data-id="' + str[1].replace('_#', '') + '" value="' + model.disclaimers.placeholders[key] + '"/>';

                } else if (str[0].replace('#_', '') === 'string') {
                    var opts = '<option> </option>';
                    if (str[1].replace('_#', '') === 'bonusTime') {
                        opts += '<option>5-7 business days</option><option>4-6 weeks</option>';
                    } else if (str[1].replace('_#', '') === 'promoCode' || str[1].replace('_#', '') === 'promoCodeFund') {
                        // TODO: Should be able to automatically put the promo codes in place...
                        if (model.projectData.inputPromo) {
                            opts += '<option>' + model.projectData.inputPromo + '</option>';
                        }
                        if (model.projectData.inputPromoFund) {
                            opts += '<option>' + model.projectData.inputPromoFund + '</option>';
                        }
                    }

                    node = '<select class="variable" data-id="' + str[1].replace('_#', '') + '" value="' + model.disclaimers.placeholders[key] + '">' +
                            opts +
                        '</select>';

                } else if (str[0].replace('#_', '') === 'date') {
                    node = '<input type="text" class="variable datepicker" data-id="' + str[1].replace('_#', '') + '" size="6" value=""/>';
                }

                raw = raw.replace(matches[i], node);
            });

            return raw;
        },
        previewItem: function () {
            $('#disc-source .disc-pool-item').on('mouseenter', function (e) {
                if (e.type === 'mouseenter') {
                    var id = $(this).attr('data-id');
                    $.each(model.disclaimers.discSet, function (i,o) {

                        if (o.id === id) {
                            var wrap = '<div class="previewOverlay">' + o.content + '</div>';
                            $('.previewContainer').fadeIn(250).empty().append(wrap);

                            return false;
                        }
                    });

                }
            });

            $('#disc-source').on('mouseleave', function () {
                $('.previewContainer').fadeOut(250).empty();
            });
        },
        removeFromSelected: function () {
            $('.disc-pool-item-remove').on('click', function () {
                var id = $(this).closest('li.disc-pool-item').attr('data-id');
                $(this).closest('li.disc-pool-item').slideUp(250, function (){
                    $(this).remove();
                    controller.disclaimers.saveProgress();
                });
                $('#disc-source li[data-id="' + id + '"]').removeClass('added');

            });
        },
        selectDisclaimer: function () {
            var set = [];
            $('#disc-selected li').each(function (i, el) {
                var id = $(el).data('id');
                var obj = {};
                var footnote;

                obj['id'] = id;

                if ($(el).find('.input-mini').length > 0) {
                    footnote = $(el).find('.input-mini').val();
                    obj['ann'] = footnote;
                }

                if ($(el).find('.variable').length > 0) {
                    var variables = {};
                    var inpt = $(el).find('.variable');

                    for (var i = inpt.length - 1; i >= 0; i--) {
                        var iid = $(inpt[i]).data('id');
                        var ival = $(inpt[i]).val();

                        if (inpt[i].type === 'number' && $(inpt[i]).data('id') !== 'copyYear') {
                            ival = ival.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                        }

                        variables[iid] = ival;
                    }
                    obj['variables'] = variables;
                }
                set.push(obj);
            });
            // if (Object.keys(d.projectData.Disclaimers).length === 0 && obj.constructor === Object ) {
            model.projectData.Disclaimers = set;
            // }
            var json = {};

            json['projectData'] = model.projectData;
            controller.cookieMonster('store', 'COFI_DISC_JSON', JSON.stringify(json));
        },
        inputChange: function () {
            $('#disc-selected').find('input, select').on('change keyup focusin focusout', function (e) {
                var set = e.currentTarget.dataset.id;
                if (e.type === 'focusin') {
                    $('.variable[data-id="' + set + '"]').addClass('is-active');
                } else if (e.type === 'focusout') {
                    $('.variable[data-id="' + set + '"]').removeClass('is-active');
                } else if (e.type === 'change') {
                    var data = $(this).val();
                    $('.variable[data-id="' + set + '"]').addClass('is-filled');

                    $('.variable[data-id="' + set + '"]').val(data);

                    controller.disclaimers.selectDisclaimer();
                }

            });

        },
        reviewDisclaimers: function (obj) {
            var d = obj;

            function Offer() {
                this.local          = false;

                if (window.location.host.indexOf('localhost') >= 0) {

                    this.local      = true;

                } else if (window.location.host.indexOf('gitub' >= 0)) {
                    this.local      = 'github'
                }

                this.promoCode      = model.projectData.inputPromo;
                this.promoCodeFund  = model.projectData.inputPromoFund;
                this.disclaimers    = model.projectData.Disclaimers;

                var x = getUrlVars();

                if (x.xcode !== undefined) {
                    var xcode = '*' + x.xcode.toUpperCase();

                    this.promoCode.promoCode += xcode;
                    this.promoCode.fundCode  += xcode;
                }

                if (this.local === true) {
                    this.baseUrl    = 'http://localhost:8888/';
                } else if (this.local === 'github') {
                    this.baseUrl    = 'https://github.kdc.capitalone.com/pages/cofi-brand-marketing/app-disclaiminator/';
                } else {
                    this.baseUrl    = 'https://content.capitaloneinvesting.com/mgdcon/jump/app/disclaiminator/';
                }

                function getUrlVars (){
                    var vars = [], hash,
                        hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

                    for(var i = 0; i < hashes.length; i++)
                    {
                        hash = hashes[i].split('=');
                        vars.push(hash[0]);
                        vars[hash[0]] = hash[1];
                    }
                    return vars;
                }
            }
            Offer.prototype.setup = function () {
                var off = this;
                var headHTML = document.getElementsByTagName('head')[0].innerHTML;
                var promoCodeEl = document.getElementsByClassName('promoCode');
                var fundCodeEl = document.getElementsByClassName('fundCode');

                headHTML += '<link rel="stylesheet" href="' + off.baseUrl + 'css/disclaimers.css" >';

                document.getElementsByTagName('head')[0].innerHTML = headHTML;

                // TODO: This could be optimized further...
                for (var i = promoCodeEl.length - 1; i >= 0; i--) {
                    promoCodeEl[i].innerHTML = off.promoCode.promoCode;
                }

                for (var i = fundCodeEl.length - 1; i >= 0; i--) {
                    fundCodeEl[i]
                }

                off.requestDisclaimers();
            };

            Offer.prototype.requestDisclaimers = function () {
                var off = this;
                var xmlUrl = off.baseUrl + "xml/disclaimers.v2.xml";
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {

                        var root = this.responseXML.childNodes[0];
                        var disclaimerArray = root.getElementsByTagName('disclaimer');
                        var container = document.getElementById('disclaimers');

                        for (var n = 0, l = off.disclaimers.length; n < l; n++) {
                            var currSel = off.disclaimers[n];

                            for (var i = disclaimerArray.length - 1; i >= 0; i--) {
                                var XMLdisc = disclaimerArray[i];
                                var XMLdiscName = XMLdisc.attributes.name.value;
                                var currSelName = currSel.id;
                                var html, vars, ann, footnote = '';

                                if (XMLdiscName === currSelName && XMLdiscName !== 'blank') {
                                    var node = document.createElement('SPAN');
                                    html = $(XMLdisc).text();
                                    $(node).addClass(currSelName);

                                    if (currSel.ann !== undefined) {
                                        ann = currSel.ann;
                                        footnote = '<sup class="footnote">' + ann + '</sup>';
                                    }

                                    if (currSel.variables !== undefined) {
                                        vars = currSel.variables;
                                        Object.keys(vars).forEach(function (key, i) {
                                            var regEx = new RegExp("<span class=\'" + key + "\'>(.*?)<\/span>", "gm");

                                            html = html.replace(regEx, "<span class='" + key + "'>" + vars[key] + "<\/span>");
                                        });
                                    }

                                    container.appendChild(node).insertAdjacentHTML('afterbegin', html);
                                    node.firstElementChild.insertAdjacentHTML('afterbegin', footnote);

                                } else if (XMLdiscName === currSelName && XMLdiscName === 'blank'){
                                    var blankSet = currSel[currSelName];

                                    for (var b = 0, sl = blankSet.length; b < sl; b++) {
                                        var node = document.createElement('SPAN');

                                        html = currSel[currSelName][b][Object.keys(currSel[currSelName][b])].content;
                                        ann = currSel[currSelName][b][Object.keys(currSel[currSelName][b])].ann;

                                        if (ann !== undefined) {
                                            footnote = '<sup class="footnote">' + ann + '</sup>';
                                        }

                                        container.appendChild(node).insertAdjacentHTML('afterbegin', decodeURIComponent(html));
                                        node.insertAdjacentHTML('afterbegin', footnote);
                                    }
                                }
                            }
                        }

                        for (var i = disclaimerArray.length - 1; i >= 0; i--) {
                            if (disclaimerArray[i].attributes.name.value === 'brokerCheck') {
                                var parent = document.getElementById('disclaimers');
                                var node = document.createElement('SPAN');

                                node.innerHTML = $(disclaimerArray[i]).text();

                                parent.insertBefore(node, parent.childNodes[0]);
                            }
                        }
                    }
                };
                xhttp.open("GET", xmlUrl, true);
                xhttp.send();
            };

            var offer = new Offer();
            offer.setup();
        },
        annotationDD: function () {
            'use strict';
            //select drop down used by disclaimers
            var annotation = $('<select></select>').attr('class', 'input-mini annotation'),
                i;

            annotation.append('<option value=""></option>');
            for (i = 1; i < 10; i += 1) {
                annotation.append("<option>" + i + "</option>");
            }
            annotation.append("<option>*</option>");
            annotation.append("<option>**</option>");
            annotation.append("<option>***</option>");
            annotation.append("<option>&dagger;</option>");
            annotation.append("<option>&dagger;&dagger;</option>");
            annotation.append("<option>&Dagger;</option>");
            annotation.append("<option>&Dagger;&Dagger;</option>");
            annotation.append("<option>#</option>");
            annotation.append("<option>##</option>");
            annotation.append("<option>||</option>");
            annotation.append("<option>&Delta;</option>");
            annotation.append("<option>&loz;</option>");

            // annotation.append("<option value='custom'>Custom</option>");

            return annotation;
        },
        saveProgress: function () {
            // TODO: Ugh, this is a mess...
            controller.disclaimers.selectDisclaimer();
        }
    },
    search: {
        /**
         * Here we have the primary search script, this script currently requires
         * the additional functions of "filterCompare" and "superbag" to function
         * properly.
         */
        searcher: function () {
            'use strict';
            var timer = null;

            // When the user changes a filter dropdown, run the comparison
            $('.js-filter-select').on('change', function () {
                controller.search.filterCompare();
            });

            // Prepare to search while the user is typing
            $('.js-filter-text').keyup(function(e){
                if(e.which === 13) {
                    clearTimeout(timer);
                    controller.search.filterCompare();
                }
                $('.js-filter-clear').addClass('is-visible');

                // If the timer has started, clear it (keep the search from running
                // too often)
                if(timer) {
                    clearTimeout(timer);
                }

                // Start the timer, then if time runs out, run the comparison script
                timer = setTimeout(function () {
                    controller.search.filterCompare();
                }, 500);
            });

            // When you click the little x in the search box, clear everything and, once
            // again, run the comparison script
            $('.js-filter-clear').on('click', function () {
                $(this).hide();
                $('.js-filter-text').val('');
                controller.search.filterCompare();
            });

            // When you click the "clear filters" button, clear everything and then run
            // the comparison script to clean things up
            $('.js-filter-clear-all').on('click', function () {
                $('.js-filter-clear').hide();
                $('.js-filter-text, .js-filter-select').val('');

                controller.search.filterCompare();
            });
        },

        /**
         * The heart and soul of the search functions.  We need to gather the filters
         * that have been selected (if any have been selected), and check the search
         * text input field for a keyword.  In the future, we should probably create
         * an array of keywords and check against an array of words in the text
         */
        filterCompare: function () {
            // Dropdown filters

            var filterArr = [],
                itemFilters,
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
                var fltr = controller.search.superbag(itemFilters, filterArr);

                if(fltr === true) {

                    // If the filter matches, move to the next step (check keyword)
                    var searchText = $('.js-filter-text').val().toLowerCase();
                    var text = $('#disc-source').find('.disc-pool-item[data-id="' + curr + '"]').text().toLowerCase();

                    model.disclaimers.discSet.forEach(function (v, i) {
                        if (model.disclaimers.discSet[i].id === curr) {
                            text += model.disclaimers.discSet[i].content.toLowerCase();
                        }
                    });

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
        },

        /**
         * Check the two arrays for matches, return the total number of matches, or,
         * return false.
         *
         * @param  {Array} sup - Array of filters for the specific disclaimer item
         * @param  {Array} sub - Array of filters selected from the dropdowns
         * @return {Bool}      - Are there matches found or not?
         */
        superbag: function (sup, sub) {
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
        }
    },
    getUrlVars: function () {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    loadJSON: function () {
        'use strict';
        console.log('load');

        var note, opts = {
            readAsDefault: "Text",
            //accept: "json",
            on: {
                beforestart: function (e, file) {
                    console.log('throbber start');
                        // return false if you want to skip this file
                },
                load: function (e, file) {
                    var content = e.target.result;

                    try {
                        var obj = JSON.parse(content);
                        var JSONObj  = {};

                        JSONObj['projectData'] = obj;
                        //parse json and populate cookie
                        controller.cookieMonster('store', 'COFI_DISC_USR', content);
                        controller.cookieMonster('store', 'COFI_DISC_JSON', JSON.stringify(JSONObj));
                        note = new Notice('success', 'Project file was successfully loaded');
                        note.pop();
                        controller.view('index');
                    } catch (err) {
                        note = new Notice('error', 'Something went wrong with the upload: ' + err);
                        note.pop();
                    }
                }
            }
        };

        $("#UploadJson").fileReaderJS(opts);

    },
    clearCookie: function () {

        // console.log(model.form.ckie);
        controller.cookieMonster('destroy', model.form.ckie);

    },
    view: function (view) {
        var app;

        var data;
        var cookieId;
        // Fill some dummy content
        if (view === 'login') {
            $('#cookie-clear').hide();
            $('.btn-startOver').hide();
            $('.btn-save, .btn-next').hide();
            $('#main').fadeTo(250, 0, function () {
                $('#main').load('views/login.htm', function () {

                    $('.js-infield').infieldLabel();
                    $('#js-auth-name, #js-auth-pass').keyup(function(event){
                        if(event.keyCode == 13){
                            controller.authenticate.run();
                        }
                    });


                    $('#main').fadeTo(250, 1);
                });
            })
        }

        if (view === 'index' || view === undefined) {
            cookieId = 'COFI_DISC_USR';
            $('#cookie-clear').show();

            $('.btn-save, .btn-next').show();
            $('.btn-startOver').hide();
            $('.nav-item-target[data-id="' + view + '"]').addClass('is-current')
                .parent().next().children().addClass('is-past').removeClass('is-current')
                .parent().next().next().children().addClass('is-past').removeClass('is-current');

            $('.nav-line').css('width', '33.33%');

            $('#main').fadeTo(250, 0, function () {
                $('#main').load('views/index.htm', function () {

                    model.form.selector = 'basic';
                    model.form.ckie = 'COFI_DISC_USR';
                    controller.form.init();

                    $('.datepicker').datepicker({
                        onSelect: function () {
                            $(this).addClass('is-filled');
                        }
                    });
                    $('.js-infield').infieldLabel();
                    controller.loadJSON();
                    $('#main').fadeTo(250, 1);


                });
            });
        }
        // This is hacky and not really reusable, but that's fine for now
        if (view === 'disclaimers') {
            $('#cookie-clear').show();
            $('.btn-save, .btn-next').show();
            $('.btn-startOver').hide();
            // This seems like a silly way to handle this...
            $('.nav-item-target[data-id="' + view + '"]').addClass('is-current').removeClass('is-past')
                .parent().prev().children().addClass('is-past').removeClass('is-current')
                .parent().next().next().children().removeClass('is-current');

            $('.nav-line').css('width', '66.66%');

            $('#main').fadeTo(250, 0, function () {
                $('#main').load('views/disclaimers.htm', function () {
                    model.form.ckie = 'COFI_DISC_JSON';
                    var cookie = controller.cookieMonster('get', cookieId);

                    if (cookie !== undefined) {
                        cookie = JSON.parse(cookie);
                    }

                    if(model.projectData.Disclaimers === undefined) {
                        controller.disclaimers.parseXML(controller.disclaimers.fillBuckets);
                    } else {
                        controller.disclaimers.fillBuckets();
                    }
                    if(model.projectData.createdDate === '') {
                        model.projectData.createdDate = DateNow();
                    }

                    model.projectData.modifiedDate = DateNow();

                    $('#disclaimerExpandView').on('change', function () {
                        if ($(this).prop('checked') === true) {
                            $.each($('#disc-selected').find('li'), function () {
                                $(this).find('.disc-pool-item-title').hide();
                                $(this).find('.disc-pool-item-content').show();
                            })

                        } else {
                            $.each($('#disc-selected').find('li'), function () {
                                $(this).find('.disc-pool-item-title').show();
                                $(this).find('.disc-pool-item-content').hide();
                            });

                        }
                    });

                    controller.search.searcher();
                    $('#main').fadeTo(250, 1);
                });
            });


        } else if (view === 'review') {
            // if (api.active === true) {
            //     PWFaction.projects();
            // }


            // This seems like a silly way to handle this...
            $('.nav-item-target[data-id="' + view + '"]').addClass('is-current').removeClass('is-past');
            $('.nav-item-target:not([data-id="' + view + '"])').removeClass('is-current').addClass('is-past');

            $('.nav-line').css('width', '100%');

            $('#main').fadeTo(250, 0, function () {
                $('#main').load('views/review.htm', function () {
                    var startOver = $('<button>', {class: 'btn btn-primary btn-startOver mod-md', text: 'Start Over'});
                    // if (api.active === false) {
                    //     $('.js-uploadToPWF').hide();
                    // }

                    $('#cookie-clear').hide();
                    $('.btn-save, .btn-next').hide();
                    $('.masthead-cell.mod-right').append(startOver)
                    $('.btn-startOver').on('click', function () {
                        controller.cookieMonster('destroy', 'COFI_DISC_JSON');
                        controller.cookieMonster('destroy', 'COFI_DISC_USR');
                        model.projectData = {};
                        model.disclaimers.baseSet = [];
                        model.disclaimers.discSet = [];
                        model.disclaimers.otherSet = [];
                        var note = new Notice('warn', 'Saved data has been cleared');
                        controller.view('index');
                        $('.js-form-next').addClass('disabled');
                        note.pop();
                    });
                    var cookie = JSON.parse(controller.cookieMonster('get', 'COFI_DISC_JSON'));
                    var obj = cookie.projectData;
                    var cont = $('#project-sticker');
                    var keyArray = ['inputProjectManager', 'inputProjectName'];
                    for (var i = Object.keys(obj).length - 1; i >= 0; i--) {
                        if (keyArray.indexOf(Object.keys(obj)[i]) >= 0) {
                            $('.' + Object.keys(obj)[i]).text(obj[Object.keys(obj)[i]]);
                        }
                    }
                    controller.disclaimers.reviewDisclaimers(cookie);
                    var down = new Downloadatron();
                    down.obj = cookie;
                    $('#Download').on('click', function () {
                        down.prepare(down.download);
                    });
                    $('.js-uploadToPWF').on('click', function () {
                        var down = new Downloadatron();
                        down.obj = cookie;
                        down.prepare(PWFaction.buildForm);
                    });
                    console.log(JSON.stringify(model.projectData));
                    $('#main').fadeTo(250, 1);
                });
            });
        }
    }
}

