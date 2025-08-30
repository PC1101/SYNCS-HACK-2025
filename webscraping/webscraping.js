var fs = require('fs');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');

var STATIONS = [
    {stationNumber: '066013', stationName:'Concord Golf Club NSW', token:'-871644936'}

];

var FROM_YEAR = 2015;
var TO_YEAR = new Date().getFullYear();
var OUT_DIR = path.join(__dirname, 'out');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

var UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

function buildUrl(stationNumber, year, token) {
    return 'https://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?p_nccObsCode=136&p_display_type=dailyDataFile&p_startYear='+year+'&p_c='+token+'&p_stn_num='+stationNumber;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url) {
    return new Promise(function(resolve, reject) {
        var options = {
            'method': 'GET',
            'url': url,
            'headers': {
                'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
                'host': 'www.bom.gov.au',
            }
        };
        request(options, function (error, response) {
            if (error) return reject(error);
            if (!response || response.statusCode < 200 || response.statusCode >= 400) {
                return reject(new Error('HTTP ' + (response && response.statusCode)));
            }
            resolve(response.body);
        });
    });
}

// Parse table → daily rows
function parseDailyTable(stationNumber, year, html) {
    var $ = cheerio.load(html);
    var out = [];

    $('#dataTable tbody tr').each(function() {
        var $tr = $(this);
        if ($tr.hasClass('graphcell')) return;
        if ($tr.attr('id') === 'summary') return;

        var rowHdr = $tr.find('th[scope="row"]').first().text().trim();
        if (!rowHdr) return;
        if (/^(Graph|Highest Daily|Monthly Total)$/i.test(rowHdr)) return;

        var dayNum = parseInt(rowHdr.replace(/\D+/g, ''), 10);
        if (!dayNum || dayNum < 1 || dayNum > 31) return;

        var tds = $tr.find('td');
        for (var mIdx = 0; mIdx < 12; mIdx++) {
            var $td = $(tds[mIdx]);
            if (!$td || !$td.length) continue;
            if ($td.hasClass('notDay')) continue;

            var raw = ($td.text() || '').trim();
            if (raw === '') continue;

            var val = parseFloat(raw);
            if (isNaN(val)) continue;

            var month = mIdx + 1;
            var date = year + '-' + String(month).padStart(2,'0') + '-' + String(dayNum).padStart(2,'0');

            out.push({ station: stationNumber, date: date, rain_mm: val });
        }
    });

    return out;
}

// Aggregate → years → months → days
var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function rowsToYearsMonths(rows) {
    var years = {};
    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var parts = r.date.split('-'); // YYYY-MM-DD
        var y = parts[0];
        var mIdx = parseInt(parts[1], 10) - 1;
        var d = String(parseInt(parts[2], 10));
        var mName = MONTHS[mIdx];

        if (!years[y]) {
            years[y] = {};
            for (var mi = 0; mi < 12; mi++) years[y][MONTHS[mi]] = {};
        }
        years[y][mName][d] = r.rain_mm;
    }
    return years;
}

function writeJson(stationObj, rows) {
    var years = rowsToYearsMonths(rows);
    var stationJson = {
        stationNum: stationObj.stationNumber,    // 🔧 show the number requested
        stationName: stationObj.stationName,     // (nice to include)
        years: years
    };
    var file = path.join(OUT_DIR, 'rain_json_' + stationObj.stationNumber + '_' + FROM_YEAR + '_' + TO_YEAR + '.json'); // 🔧 filename by number
    fs.writeFileSync(file, JSON.stringify(stationJson, null, 2), 'utf8');
    console.log('[WRITE]', file);
}

// Main
(async function main() {
    for (var s = 0; s < STATIONS.length; s++) {
        var st = STATIONS[s];                         // 🔧 this is the object
        var all = [];
        for (var y = FROM_YEAR; y <= TO_YEAR; y++) {
            var url = buildUrl(st.stationNumber, y,st.token);    // 🔧 use stationNumber
            console.log(url);
            try {
                var html = await httpGet(url);
                var rows = parseDailyTable(st.stationNumber, y, html); // 🔧 use stationNumber
                all = all.concat(rows);
                console.log('[OK]', st.stationNumber, y, '→', rows.length, 'rows');
            } catch (e) {
                console.warn('[WARN]', st.stationNumber, y, 'failed:', e.message || e);
            }
            await sleep(750);
        }
        writeJson(st, all);                            // 🔧 pass object so we can include name/number
        await sleep(1500);
    }
    console.log('Done.');
})().catch(function(err){
    console.error(err);
    process.exit(1);
});
