
function configureLogging() {
    function log(level, messages) {
        const text = messages
            .map(message => {
                if (typeof message === 'object') {
                    return JSON.stringify(message, null, 2);
                } else {
                    return message;
                }
            })
            .join(' ');
        $('#logs').append($(`<div class="${level.toLowerCase()}">`).text(`[${new Date().toISOString()}] [${level}] ${text}\n`));
    }

    console._error = console.error;
    console.error = function(...rest) {
        log('ERROR', Array.prototype.slice.call(rest));
        console._error.apply(this, rest);
    };

    console._warn = console.warn;
    console.warn = function(...rest) {
        log('WARN', Array.prototype.slice.call(rest));
        console._warn.apply(this, rest);
    };

    console._log = console.log;
    console.log = function(...rest) {
        log('INFO', Array.prototype.slice.call(rest));
        console._log.apply(this, rest);
    };
}

function getRandomClientId() {
    return Math.random()
        .toString(36)
        .substring(2)
        .toUpperCase();
}

function getFormValues() {
    return {
        region: $('#region').val() || 'us-west-2',
        channelName: $('#channelName').val() || '1326-N6',
        clientId: "noname",
        useTrickleICE: true,
        natTraversalDisabled: false,
        forceTURN: false,
        accessKeyId: $('#accessKeyId').val() || 'AKIA3QR54AC4DWMMJPCU',
        endpoint: null,
        secretAccessKey: $('#secretAccessKey').val(),
        sessionToken: null,
    };
}

function onStatsReport(report) {
    // TODO: Publish stats
    if (report == {}) {
        console.log('[REPORT]', report);
    }
}

function onStop() {
    for (let i=0; i<4; i++) {
        stopViewer(i);
    }
    $('#viewer').addClass('d-none');
    $('#form').removeClass('d-none');
}

window.addEventListener('beforeunload', onStop);

window.addEventListener('error', function(event) {
    console.error(event.message);
    event.preventDefault();
});

window.addEventListener('unhandledrejection', function(event) {
    console.error(event.reason.toString());
    event.preventDefault();
});

configureLogging();

$('#viewer-button').click(async () => {
    $('#form').addClass('d-none');
    $('#viewer').removeClass('d-none');

    const remoteViews = [];
    const allValues = [];
    const formValues = getFormValues();

    //console.log($('#viewer .remote-view'));

    for (let i=0; i < 4; i++) {
        allValues[i] = Object.assign({}, formValues);
        allValues[i].channelName += '_CH' + String(i+1).padStart(2, '0');
        allValues[i].clientId = getRandomClientId();
        console.log(allValues[i].channelName, allValues[i].clientId);

        remoteViews[i] = $('#viewer .remote-view')[i];

        startViewer(i, remoteViews[i], allValues[i], onStatsReport, event => {
            //console.warn(`${event.data}`);
            console.warn(event);
        });
    }
});

$('#stop-viewer-button').click(onStop);


// Read/Write all of the fields to/from localStorage so that fields are not lost on refresh.
const urlParams = new URLSearchParams(window.location.search);
const fields = [
    { field: 'channelName', type: 'text' },
    { field: 'region', type: 'text' },
    { field: 'accessKeyId', type: 'text' },
    { field: 'secretAccessKey', type: 'text' },
];
fields.forEach(({ field, type, name }) => {
    const id = '#' + field;

    // Read field from localStorage
    try {
        const localStorageValue = localStorage.getItem(field);
        if (localStorageValue) {
            if (type === 'checkbox' || type === 'radio') {
                $(id).prop('checked', localStorageValue === 'true');
            } else {
                $(id).val(localStorageValue);
            }
            $(id).trigger('change');
        }
    } catch (e) {
        /* Don't use localStorage */
    }

    // Read field from query string
    if (urlParams.has(field)) {
        paramValue = urlParams.get(field);
        if (type === 'checkbox' || type === 'radio') {
            $(id).prop('checked', paramValue === 'true');
        } else {
            $(id).val(paramValue);
        }
    }

    // Write field to localstorage on change event
    $(id).change(function() {
        try {
            if (type === 'checkbox') {
                localStorage.setItem(field, $(id).is(':checked'));
            } else if (type === 'radio') {
                fields
                    .filter(fieldItem => fieldItem.name === name)
                    .forEach(fieldItem => {
                        localStorage.setItem(fieldItem.field, fieldItem.field === field);
                    });
            } else {
                localStorage.setItem(field, $(id).val());
            }
        } catch (e) {
            /* Don't use localStorage */
        }
    });
});

// The page is all setup. Hide the loading spinner and show the page content.
$('.loader').addClass('d-none');
$('#main').removeClass('d-none');
console.log('Page loaded');
