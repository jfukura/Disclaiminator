function Disclosure () {
    this.title = '';
    this.content = '';
    this.attrs = [];
}

var model = {
    disclosures: [],
    html: '',
    placeholders: {
        'bonusTime': '4-6 weeks',
        'bonusBusinessDays': 1,
        'calendarDays': 90,
        'copyYear': new Date().getFullYear(),
        'leastMonths': 9,
        'leastMonths2': 9,
        'numberofTrades': 1,
        'openDate': 'MM/DD/YYYY',
        'tradeDate': 'MM/DD/YYYY',
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
    },
    expandState: false
}

var app = {
    init: function (cb) {

        $.ajax({
            type: 'GET',
            url: 'xml/disclaimers.v2.xml',
            cache : false,
            success: function (data) {
                var $xml = $(data);
                var node = $xml.find('root').children();

                node.each(function (i, v) {

                    // Create a new instance of the Disclaimer Object
                    var disclaimer = new Disclosure();

                    // For each of the attributes...
                    $.each(this.attributes, function (i, a) {

                        if (a.name === 'title') {
                            disclaimer.title = a.value;
                        }

                        if (a.name !== 'name' && a.name !== 'title') {
                            disclaimer.attrs.push(a.value);
                        }

                        var data = app.definePlaceholders($(v).text().trim());

                        disclaimer.content = data;

                    });

                    model.disclosures.push(disclaimer);
                });

            },
            complete: function (response) {
                cb();

            }
        });
    },
    buildContent: function () {
        var html = '<ul class="disclaimerList">';

        $.each(model.disclosures, function (i, obj) {
            var attr = obj.attrs.join(' ');

            html += '<li class="disclaimerList-item" data-attrs="' + attr + '">' +
                    '<h2 class="disclaimerList-item-title">' + obj.title + '</h2><span class="disclaimerList-item-body">' + obj.content + '</span>' +
                '</li>';


        });
        html += '</ul>';

        model.html = html;

        $('#disclaimers').append(html);
        app.inputHandler();

    },
    addToTemplate: function (cb) {
        $.ajax({
            type: 'GET',
            url: 'templates/DisclaimerList.txt',
            cache : false,
            success: function (data) {
                var date = new Date();

                data = data.replace('{{date}}', date.toString());
                data = data.replace('{{content}}', model.html);

                cb(data);
            },
            complete: function (response) {

            }
        });
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

            node = '<span class="variable" style="background: yellow;">' + model.placeholders[key] + '</span>';

            raw = raw.replace(matches[i], node);
        });

        return raw;
    },
    inputHandler: function () {
        // expand/collapse items
        app.search.searcher();

        $('.disclaimerList-item-title').on('click', function () {
            $(this).closest('li').toggleClass('is-collapsed');
        });
    },
    toggleExpand: function () {
        if (model.expandState === false) {
            model.expandState = true;

            $('.disclaimerList-item').each(function () {
                $(this).addClass('is-collapsed');
            });
        } else {
            model.expandState = false;

            $('.disclaimerList-item').each(function () {
                $(this).removeClass('is-collapsed');
            });
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
                app.search.filterCompare();
            });

            // Prepare to search while the user is typing
            $('.js-filter-text').keyup(function(e){
                if(e.which === 13) {
                    clearTimeout(timer);
                    app.search.filterCompare();
                }
                $('.js-filter-clear').addClass('is-visible');

                // If the timer has started, clear it (keep the search from running
                // too often)
                if(timer) {
                    clearTimeout(timer);
                }

                // Start the timer, then if time runs out, run the comparison script
                timer = setTimeout(function () {
                    app.search.filterCompare();
                }, 500);
            });

            // When you click the little x in the search box, clear everything and, once
            // again, run the comparison script
            $('.js-filter-clear').on('click', function () {
                $(this).hide();
                $('.js-filter-text').val('');
                app.search.filterCompare();
            });

            // When you click the "clear filters" button, clear everything and then run
            // the comparison script to clean things up
            $('.js-filter-clear-all').on('click', function () {
                $('.js-filter-clear').hide();
                $('.js-filter-text, .js-filter-select').val('');

                app.search.filterCompare();
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

            $('#disclaimers').find('li').each(function (i, v) {

                if ($(this).data('attrs') !== undefined) {
                    itemFilters = $(this).data('attrs').split(' ');

                    // Check to see if any of the selected filters match for this item
                    var fltr = app.search.superbag(itemFilters, filterArr);

                    if(fltr === true) {

                        $(v).removeClass('filter-out');
                        // If the filter matches, move to the next step (check keyword)
                        var searchText = $('.js-filter-text').val();
                        var text = $(v).text();


                        if(searchText !== '' && text.indexOf(searchText) >= 0 ) {
                            $(v).html(function (i, html) {
                                var find = text.match(new RegExp(searchText, 'i'));
                                console.log(find)
                                return html.replace(new RegExp(searchText, 'ig'), '<span class="searchedFor">' + find + '</span>');

                            });
                            // If the search text matches text within this item, remove the
                            // filter on the item
                            $(v).removeClass('filter-out');
                        } else if (searchText !== '' && text.indexOf(searchText) <= 0 ) {

                            // Otherwise, let's filter this item out
                            $(v).addClass('filter-out');
                        } else {
                            $(v).removeClass('filter-out');
                        }
                    } else {
                        // There aren't any text filters that match, so let's just hide this
                        $(v).addClass('filter-out');
                    }
                }
            });

            // Find all of the items that need to be filtered out, and hide them
            $('.filter-out').slideUp(250);

            // Find the ones that aren't filtered out, and show them
            $('.disclaimerList-item').not('.filter-out').slideDown(250);
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
    downloadWord: function (data) {
        var zip = new JSZip();

        // TEMPORARY BUG: Rewrite this so it works...
        var name = 'DisclaimerList';

        zip.file(name + '.doc', data);

        content = zip.generate({type:"blob"});
        saveAs(content, name + '.zip');
    }
}