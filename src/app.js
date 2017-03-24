import * as ReactDOM from 'react-dom';

const TreeListDemo = require('async-module-loader?name=TreeListDemo!Modules/TreeListDemo');

ReactDOM.render(TreeListDemo, document.getElementById('tree-list-container'));
