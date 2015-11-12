var headers = [];
var csv;
var csvMax = Math.pow(10, 6) * 2;
var $download = $('button');
var $listSelect = $('<select class="proplist" size="10"/>');
var $listChosen = $('<select class="proplist" size="10"/>');
var $include = $('<button id="include" class="listbutton button"/>').text('add');
var $remove = $('<button id="remove" class="listbutton button"/>').text('remove');
var $reportbody = $('.report-body');
var $loading = $('div.loading');
var progressCircle;
var lastPercent = 0.00;

function processUser(user) {
    currPercent = (this.counter / this.total).toFixed(2)
    if (currPercent > lastPercent) {
        lastPercent = currPercent
        progressCircle.animate(currPercent)
    }
    var vals = []
    headers.forEach(function(prop) {
        if (user.hasOwnProperty(prop)) {
            var value = user[prop]
            if (typeof user[prop] == 'object') {
                if (prop == '$transactions') {
                    vals.push(tallyRevenue(user[prop]));
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
    csv += encodeURI('\n' + vals.join())
    if (csv.length > csvMax) {
        downloadCSV()
    }
}

function downloadCSV() {
    if (csv == undefined) {
        console.log("no people to export")
        return
    }
    var filename = 'people.csv';
    var link = document.createElement('a');
    link.setAttribute('href', csv);
    link.setAttribute('download', filename);
    link.click();
    $(link).remove();
    csv = encodeURI('data:text/csv;charset=utf-8,' + encodeURI(headers.join()));
}

function tallyRevenue(transactions) {
    var total = 0;
    if (transactions instanceof Array) {
        transactions.forEach(function(item) {
            total += item['$amount']
        })
    }
    return total
}

function finishProcessing() {
    downloadCSV();
    loading(false);
    lastPercent = 0.0;
    progressCircle.set(0);
}

function loading(status) {
    if (status === true) {
        $reportbody.css('-webkit-filter', 'blur(3px)');
        $loading.show();
    } else if (status === false) {
        $reportbody.css('-webkit-filter', 'blur(0px)');
        $loading.hide();
    }
}

function run() {
    $include.on('click', function() {
        var selected = $listSelect.val();
        $listSelect.find('option:selected').remove();
        $listChosen.append($('<option />').attr('value', selected).text(selected));
    });
    $remove.on('click', function() {
        var selected = $listChosen.val();
        $listChosen.find('option:selected').remove();
        $listSelect.append($('<option />').attr('value', selected).text(selected));
    });
    $download.on('click', function() {
        loading(true);
        var whereProps = [];
        headers = [];
        $listChosen.find('option').each(function(i, el) {
            var prop = el.getAttribute('value');
            if (prop !== "$distinct_id") {
                whereProps.push('(defined (properties["' + prop + '"]))');
            }
            headers.push(prop);
        });
        if (whereProps.length > 0) {
            var selector = whereProps.join(" or ");
        }
        csv = encodeURI('data:text/csv;charset=utf-8,' + encodeURI(headers.join()));
        PeoplePager(processUser, selector, finishProcessing);
    });

    progressCircle = new ProgressBar.Circle("#progress", {
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

$(function() {
    MP.api.query('api/2.0/engage/properties', {
        limit: '2000'
    }).done(function(d) {
        $listChosen.append($('<option value="$distinct_id" />').text('$distinct_id'));
        for (prop in d.results) {
            $listSelect.append($('<option />').attr('value', prop).text(prop));
        }
        $('#propsSelect').append($listSelect);
        $listSelect.after($include);
        $('#propsChosen').append($listChosen);
        $listChosen.after($remove);
        loading(false);
        run();
    });
})
