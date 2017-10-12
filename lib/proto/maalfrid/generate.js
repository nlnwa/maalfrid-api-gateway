var cl = require('country-language');

cl.getLanguageCodes('3', (err, codes) => {
    var frequent = ['nob', 'nno', 'dan', 'swe', 'eng', 'fra', 'sma', 'smj', 'sme'];
    // Remove frequent languages from array
    frequent.forEach((value) => codes.splice(codes.indexOf(value), 1));
    // Remove local value
    codes.splice(codes.indexOf('qaa-qtz'), 1);
    // Place frequent languages at front
    codes = frequent.concat(codes);
    // Print languages;
    console.log('UNKNOWN = 0;');
    codes.forEach((code, index) => console.log(code.toUpperCase() + " = " + (index + 1) + ";"));
});
