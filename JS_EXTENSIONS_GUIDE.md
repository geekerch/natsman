# JavaScript Extensions Feature

## Overview

The JavaScript Extensions feature allows you to extend NatsMan's variable functionality by loading custom JavaScript files. These extensions can provide additional helper functions that can be used in dynamic variables.

## Directory Structure

JavaScript extension files should be placed in the `extensions/` directory (created automatically at the same level as the `templates/` directory).

```
natsman/
├── templates/
│   └── ... (your templates)
├── extensions/
│   ├── example.js
│   └── your-custom.js
└── profiles.json
```

## Usage

### 1. Creating Extension Files

Create a `.js` file in the `extensions/` directory with your custom functions:

```javascript
// extensions/myhelpers.js

// Generate random email
function randomEmail() {
    const domains = ['example.com', 'test.com', 'demo.com'];
    const randomStr = Math.random().toString(36).substring(2, 8);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `user_${randomStr}@${domain}`;
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}
```

### 2. Activating Extensions

1. Click the **Extensions** button in the sidebar (📄 icon)
2. Check the boxes next to the extensions you want to activate
3. Click **Save**

### 3. Using Extension Functions

Once activated, extension functions are available in dynamic variables:

**Global Variables (dynamic type):**
```javascript
randomEmail()
```

**Template Variables:**
```json
{
  "user": "{{.userId}}",
  "email": "{{.userEmail}}",
  "created": "{{.timestamp}}"
}
```

Where `userEmail` could be a dynamic variable with value: `randomEmail()`

## Example Extensions

### Example 1: Random Data Generators

```javascript
function randomEmail() {
    const domains = ['example.com', 'test.com'];
    const user = Math.random().toString(36).substring(2, 8);
    return `${user}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function randomPhone() {
    return `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
}
```

### Example 2: Time Helpers

```javascript
function timestamp(format) {
    const now = new Date();
    const formats = {
        'iso': now.toISOString(),
        'unix': Math.floor(now.getTime() / 1000),
        'date': now.toISOString().split('T')[0]
    };
    return formats[format] || now.toISOString();
}
```

### Example 3: Data Formatters

```javascript
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function lorem(words = 10) {
    const loremWords = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'];
    const result = [];
    for (let i = 0; i < words; i++) {
        result.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
    }
    return result.join(' ');
}
```

## Built-in Functions

NatsMan already provides these built-in functions (no extension needed):

- `timestamp()` - Unix timestamp in seconds
- `timestampMs()` - Unix timestamp in milliseconds
- `uuid()` - Generate UUID v4
- `randomInt(min, max)` - Random integer
- `now()` - ISO 8601 timestamp
- `dateFormat(layout)` - Custom time format

## Technical Details

### Extension Loading

- Extensions are loaded per request/publish operation
- Each extension file is evaluated in the JavaScript VM before executing dynamic variables
- Extensions are loaded in the order they appear in the active list
- Functions defined in extensions are available globally within the VM

### JavaScript Runtime

- Extensions run in a **goja** JavaScript VM (ECMAScript 5.1 compatible)
- Execution timeout: 1 second per evaluation
- Sandboxed environment (no file system or network access)
- No Node.js modules (Buffer, require, etc. are not available)

### Storage

Active extensions are stored in `profiles.json`:

```json
{
  "js_extensions": [
    "example.js",
    "custom-helpers.js"
  ]
}
```

## Best Practices

1. **Keep functions pure**: Avoid side effects
2. **Handle errors**: Return sensible defaults if operations fail
3. **Use descriptive names**: Function names should be clear and avoid conflicts
4. **Test thoroughly**: Test your extensions with different inputs
5. **Document your functions**: Add comments explaining what each function does

## Limitations

- ECMAScript 5.1 compatibility only (no ES6+ features)
- No async/await support
- No access to external libraries
- 1 second execution timeout
- No DOM or Node.js APIs

## Troubleshooting

### Extension not loading

- Check file has `.js` extension
- Verify file is in the `extensions/` directory
- Check browser console for JavaScript errors

### Function not available

- Ensure extension is checked in the Extensions modal
- Click Save after selecting extensions
- Verify function name is correct (case-sensitive)

### Timeout errors

- Simplify complex calculations
- Avoid infinite loops
- Use efficient algorithms

## API Reference

### Backend Methods (Desktop Mode)

- `ListJSExtensions()` - Get list of available extension files
- `GetActiveJSExtensions()` - Get list of active extensions
- `SetActiveJSExtensions(extensions)` - Set active extensions

### HTTP API (Server Mode)

- `GET /api/extensions` - List available and active extensions
- `POST /api/extensions/activate` - Activate extensions
- `POST /api/extensions/add/:filename` - Add extension to active list
- `DELETE /api/extensions/:filename` - Remove extension from active list

## Examples in Use

### Example Template with Extensions

```
Mode: pubsub
Subject: user.created
---
{
  "userId": "{{.userId}}",
  "email": "{{.email}}",
  "phone": "{{.phone}}",
  "created": "{{.timestamp}}"
}
```

**Global Variables:**
- `userId` (dynamic): `uuid()`
- `email` (dynamic): `randomEmail()` ← from extension
- `phone` (dynamic): `randomPhone()` ← from extension
- `timestamp` (dynamic): `timestamp('iso')` ← from extension

This will generate:
```json
{
  "userId": "a3f7e9c1-4b2d-8e1a-9c6f-3d8b2a1e4c5d",
  "email": "user_k7x9p2@test.com",
  "phone": "+1-555-123-4567",
  "created": "2024-01-15T10:30:00.000Z"
}
```

## Future Enhancements

- Support for extension dependencies
- Extension marketplace
- Hot reload of extensions
- Extension testing framework
- More built-in helper libraries
