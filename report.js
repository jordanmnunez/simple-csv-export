var exp = {}
$(function() {

    exp.csv;
    exp.filename = 'people.csv';
    exp.headers = [];
    exp.csvMax = Math.pow(10, 6) * 2;
    exp.$download = $('button');
    exp.$listSelect = $('<select class="proplist" size="10"/>');
    exp.$listChosen = $('<select class="proplist" size="10"/>');
    exp.$include = $('<button id="include" class="listbutton button"/>').text('add');
    exp.$remove = $('<button id="remove" class="listbutton button"/>').text('remove');
    exp.$reportbody = $('.report-body');
    exp.$loading = $('div.loading');
    exp.progressCircle;
    exp.lastPercent = 0;

    exp.processUser = function(user) {
        currPercent = (this.counter / this.total).toFixed(2)
        if (currPercent > exp.lastPercent) {
            exp.lastPercent = currPercent
            exp.progressCircle.animate(currPercent)
        }
        var vals = []
        exp.headers.forEach(function(prop) {
            if (user.hasOwnProperty(prop)) {
                var value = user[prop]
                if (typeof user[prop] == 'object') {
                    if (prop == '$transactions') {
                        vals.push(exp.tallyRevenue(user[prop]));
                    } else {
                        vals.push('object');
                    }
                } else {
                    if (value.indexOf && value.indexOf(',') > 0) {
                        value = value.replace(/[,]/g, '');
                    }
                    vals.push(value)
                }
            } else {
                vals.push('')
            }
        })
        exp.csv += encodeURI('\n' + vals.join())
        if (exp.csv.length > exp.csvMax) {
            exp.downloadCSV()
        }
    }

    exp.downloadCSV = function() {
        var link = document.createElement('a');
        link.setAttribute('href', exp.csv);
        link.setAttribute('download', exp.filename);
        link.click();
        $(link).remove();
        exp.csv = encodeURI('data:text/csv;charset=utf-8,' + encodeURI(exp.headers.join()));
    }

    exp.tallyRevenue = function(transactions) {
        var total = 0;
        if (transactions instanceof Array) {
            transactions.forEach(function(item) {
                total += item['$amount']
            })
        }
        return total
    }

    exp.finishProcessing = function() {
        exp.downloadCSV();
        exp.loading(false);
        exp.lastPercent = 0.0;
        exp.progressCircle.set(0);
    }

    exp.loading = function(status) {
        if (status === true) {
            exp.$reportbody.css('-webkit-filter', 'blur(3px)');
            exp.$loading.show();
        } else if (status === false) {
            exp.$reportbody.css('-webkit-filter', 'blur(0px)');
            exp.$loading.hide();
        }
    }

    exp.run = function() {
        exp.$include.on('click', function() {
            var selected = exp.$listSelect.val();
            exp.$listSelect.find('option:selected').remove();
            exp.$listChosen.append($('<option />').attr('value', selected).text(selected));
        });
        exp.$remove.on('click', function() {
            var selected = exp.$listChosen.val();
            exp.$listChosen.find('option:selected').remove();
            exp.$listSelect.append($('<option />').attr('value', selected).text(selected));
        });
        exp.$download.on('click', function() {
            exp.loading(true);
            var whereProps = [];
            exp.headers = [];
            exp.$listChosen.find('option').each(function(i, el) {
                var prop = el.getAttribute('value');
                if (prop !== "$distinct_id") {
                    whereProps.push('(defined (properties["' + prop + '"]))');
                }
                exp.headers.push(prop);
            });
            if (whereProps.length > 0) {
                var selector = whereProps.join(" or ");
            }
            exp.csv = encodeURI('data:text/csv;charset=utf-8,' + encodeURI(exp.headers.join()));
            PeoplePager(exp.processUser, exp.selector, exp.finishProcessing);
        });

        exp.progressCircle = new ProgressBar.Circle("#progress", {
            color: '#FCB03C',
            strokeWidth: 5,
            trailWidth: 3,
            duration: 250,
            text: {
                value: '0',
                style: {
                    "font-size": "75px",
                    "font-family": 'proxima-nova, sans-serif'
                }
            },
            step: function(state, bar) {
                bar.setText((bar.value() * 100).toFixed(0));
            }
        });
    }

    MP.api.query('api/2.0/engage/properties', {limit: '2000'}).done(function(d) {
        exp.$listChosen.append($('<option value="$distinct_id" />').text('$distinct_id'));
        for (prop in d.results) {
            exp.$listSelect.append($('<option />').attr('value', prop).text(prop));
        }
        $('#propsSelect').append(exp.$listSelect);
        exp.$listSelect.after(exp.$include);
        $('#propsChosen').append(exp.$listChosen);
        exp.$listChosen.after(exp.$remove);
        exp.loading(false);
        exp.run();
    });
})
