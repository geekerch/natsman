// Advanced JS Extension for NatsMan
// This file provides more advanced helper functions

// Generate fake person data
function fakePerson() {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        fullName: firstName + ' ' + lastName,
        email: firstName.toLowerCase() + '.' + lastName.toLowerCase() + '@example.com',
        age: Math.floor(Math.random() * 50) + 18
    });
}

// Generate fake address
function fakeAddress() {
    const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Pine Rd', 'Cedar Ln'];
    const cities = ['Springfield', 'Riverside', 'Fairview', 'Clinton', 'Madison'];
    const states = ['CA', 'NY', 'TX', 'FL', 'IL'];
    
    return JSON.stringify({
        street: Math.floor(Math.random() * 9999) + 1 + ' ' + streets[Math.floor(Math.random() * streets.length)],
        city: cities[Math.floor(Math.random() * cities.length)],
        state: states[Math.floor(Math.random() * states.length)],
        zipCode: String(Math.floor(Math.random() * 90000) + 10000)
    });
}

// Generate credit card number (for testing only - not real)
function fakeCreditCard() {
    const prefix = ['4', '5', '3']; // Visa, MC, Amex
    const pre = prefix[Math.floor(Math.random() * prefix.length)];
    let num = pre;
    
    for (let i = 0; i < 15; i++) {
        num += Math.floor(Math.random() * 10);
    }
    
    return num.match(/.{1,4}/g).join('-');
}

// Generate random color
function randomColor(format) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    if (format === 'rgb') {
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    } else if (format === 'hex') {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

// Generate random username
function randomUsername() {
    const adjectives = ['Cool', 'Super', 'Mega', 'Ultra', 'Happy', 'Lucky', 'Swift', 'Bright'];
    const nouns = ['Tiger', 'Eagle', 'Dragon', 'Phoenix', 'Wolf', 'Bear', 'Lion', 'Hawk'];
    const number = Math.floor(Math.random() * 1000);
    
    return adjectives[Math.floor(Math.random() * adjectives.length)] + 
           nouns[Math.floor(Math.random() * nouns.length)] + 
           number;
}

// Generate URL slug from text
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Calculate hash (simple hash for testing)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// Generate API key format string
function apiKey(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = prefix || 'sk';
    key += '_';
    
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return key;
}

// Generate semantic version
function randomVersion() {
    const major = Math.floor(Math.random() * 5) + 1;
    const minor = Math.floor(Math.random() * 20);
    const patch = Math.floor(Math.random() * 50);
    
    return major + '.' + minor + '.' + patch;
}

// Generate random IP address
function randomIP() {
    return Math.floor(Math.random() * 256) + '.' +
           Math.floor(Math.random() * 256) + '.' +
           Math.floor(Math.random() * 256) + '.' +
           Math.floor(Math.random() * 256);
}

// Generate MAC address
function randomMAC() {
    const hex = '0123456789ABCDEF';
    let mac = '';
    
    for (let i = 0; i < 6; i++) {
        if (i > 0) mac += ':';
        mac += hex.charAt(Math.floor(Math.random() * 16));
        mac += hex.charAt(Math.floor(Math.random() * 16));
    }
    
    return mac;
}

// Generate JSON array with N items
function jsonArray(count, template) {
    const items = [];
    for (let i = 0; i < count; i++) {
        items.push(i);
    }
    return JSON.stringify(items);
}

// Random boolean
function randomBool() {
    return Math.random() < 0.5;
}

// Random choice from array (passed as comma-separated string)
function randomChoice(choices) {
    const arr = choices.split(',').map(function(s) { return s.trim(); });
    return arr[Math.floor(Math.random() * arr.length)];
}

// Encode string to hex
function toHex(str) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16);
    }
    return hex;
}

// Repeat string N times
function repeat(str, count) {
    let result = '';
    for (let i = 0; i < count; i++) {
        result += str;
    }
    return result;
}
