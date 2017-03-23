const path = require('path');

module.exports = {
    output: {
        path: path.join(__dirname, 'assets')
    },
    source: {
        path: path.join(__dirname, 'src')
    },
    static: {
        path: path.join(__dirname, 'static')
    }
};
