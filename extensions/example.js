// Example JS Extension for NatsMan
// This file adds custom helper functions for template variables

// Generate random email address
function randomEmail() {
    const domains = ['example.com', 'test.com', 'demo.com'];
    const randomStr = Math.random().toString(36).substring(2, 8);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `user_${randomStr}@${domain}`;
}

// Generate random phone number
function randomPhone() {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNum = Math.floor(Math.random() * 9000) + 1000;
    return `+1-${areaCode}-${prefix}-${lineNum}`;
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Generate random between min and max (float)
function randomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
}

// Get current timestamp in custom format
function timestamp(format) {
    const now = new Date();
    const formats = {
        'iso': now.toISOString(),
        'unix': Math.floor(now.getTime() / 1000),
        'ms': now.getTime(),
        'date': now.toISOString().split('T')[0],
        'time': now.toTimeString().split(' ')[0]
    };
    return formats[format] || now.toISOString();
}

// Base64 encode
function base64Encode(str) {
    return Buffer.from(str).toString('base64');
}

// Generate Lorem Ipsum text
function lorem(words = 10) {
    const loremWords = [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud'
    ];
    const result = [];
    for (let i = 0; i < words; i++) {
        result.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
    }
    return result.join(' ');
}
