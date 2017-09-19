var disclaimerManager;

var Manager = function (arr) {
    this.controller.gatherJson(arr);
    // - Array of json files to pull from
};

Manager.prototype.model = {
    // Things to store in the model
    // - Array of objects based on the json file array
    test: 'value',
    projects: []
};

Manager.prototype.controller = {
    gatherJson : function (array) {
        var promises = [];

        for (var i = 0; i < array.length; i++) {
            var url = 'projects/' + array[i];
            var id = array[i];

            var promise = $.getJSON(url, function (data) {
                disclaimerManager.model.projects.push(data);
            });

            promises.push(promise);
        };

        $.when.apply($, promises)
            .done(function() {
                disclaimerManager.controller.buildProjectTable();
            }).fail(function() {
                // TODO: something went wrong with gathering JSON files, handle it
            });
    },
    viewHandler : function () {
        console.log('handler')
        var $editLink = $('.js-edit-project');

        $editLink.on('click', function (e) {
            e.preventDefault();

            var project = $(this).closest('tr').attr('id');
            console.log(project);
            for (var i = 0; i < disclaimerManager.model.projects.length; i++) {

                if (disclaimerManager.model.projects[i].id === project) {
                    disclaimerManager.controller.cookieMonster('store', 'COFI_DISC_USR', JSON.stringify(disclaimerManager.model.projects[i]));
                    window.location.href = '../';
                }
            }
        });
    },
    buildProjectTable : function () {
        var projects = disclaimerManager.model.projects;
        // var fields = [
        //     'inputProjectName', 'inputProjectManager', 'modifiedDate', 'url', 'selectPC',
        //     'Disclaimers', 'account', 'inputPromo', 'inputPromoFund', 'inputTracking'
        // ];

        for (var i = 0; i < projects.length; i++) {
            // Build the table
            var keys = Object.keys(projects[i]);
            var tmpl = $('#row').html();

            tmpl = tmpl.replace(/{{id}}|{{url}}|{{expiryDate}}|{{modifiedDate}}|{{inputProjectName}}|{{inputProjectManager}}|{{inputTracking}}|{{account}}|{{inputPromo}}|{{inputPromoFund}}|{{selectPC}}/gi, function(matched, b, c){
                // Look in the object for the variable to match (should
                // match the key of the object)
                var matchData = projects[i][matched.replace('{{', '').replace('}}', '')];

                if (matchData !== null && matched.replace('{{', '').replace('}}', '') === 'account') {
                    switch (matchData) {
                        case 'ind':
                            matchData = 'Individual';
                            break;
                        case 'jnt':
                            matchData = 'Joint';
                            break;
                        case 'trad':
                            matchData = 'Traditional IRA';
                            break;
                        case 'roth':
                            matchData = 'Roth IRA';
                            break;
                        case 'rollIRA':
                            matchData = 'Rollover IRA';
                            break;
                        case 'cust':
                            matchData = 'Custodial Account';
                            break;
                        case 'esa':
                            matchData = 'Education Savings Account';
                            break;
                    }
                }

                if (matchData !== null && matched.replace('{{', '').replace('}}', '') === 'selectPC') {
                    switch (matchData.PC) {
                        case 'AF':
                            matchData = 'Affiliates Default';
                            break;
                        case 'DS':
                            matchData = 'Display Default';
                            break;
                        case 'LS':
                            matchData = 'LinkShare';
                            break;
                        case 'PD':
                            matchData = 'Partner Default';
                            break;
                        case 'RT':
                            matchData = 'Retirement Default';
                            break;
                        case 'SC':
                            matchData = 'Search Default';
                            break;
                        case 'MD':
                            matchData = 'Marketing Default';
                            break;
                        case 'XD':
                            matchData = 'Cross-Sell Default';
                            break;
                    }
                }

                return matchData
            });

            $('#projects tbody').append(tmpl);
            // Get page status

            // $('#' + projects[i].id).find('.status')
            disclaimerManager.controller.getPageStatus(projects[i].url + projects[i].test, projects[i].id);
        };

        var table = $('#projects').DataTable({
            paging: false
        });

        disclaimerManager.controller.viewHandler();

        // table.on('click', function (e) {
        //     console.log($(e.target).closest('tr'));
        // })
    },
    /**
     * Status Boolean
     *
     * Returns a boolean response as to whether or not a page is currently up
     *
     * @return {Boolean} :: Live or not
     */
    getPageStatus : function (url, id) {
        var live;

        // var request = $.ajax({
        //     url: url,
        //     dataType: "script",
        //     timeout: 2 * 1000,
        //     error: function() {
        //         live = 'mod-fail';

        //     },
        //     success: function () {
        //         live = 'mod-success';
        //     },
        //     complete: function () {
        //         console.log(id);
        //         $('#' + id).find('.status').addClass(live);
        //     }
        // });
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
            document.cookie = name + "=" + value + '; path=/' + expires;
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
}

$(function () {

    $.getJSON( "js/projects.json", function( data ) {
        disclaimerManager = new Manager(data);
    });
});
