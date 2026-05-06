const { translations } = require('./locales/translations.ts');

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getKeys(obj[key], `${prefix}${key}.`));
        } else {
            keys.push(`${prefix}${key}`);
        }
    }
    return keys;
}

const enKeys = getKeys(translations.en);
const viKeys = getKeys(translations.vi);

const missingInVi = enKeys.filter(k => !viKeys.includes(k));
const missingInEn = viKeys.filter(k => !enKeys.includes(k));

console.log('Missing in VI:', missingInVi);
console.log('Missing in EN:', missingInEn);
