import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {TreeListDemo} from 'Modules/TreeListDemo';

require('Styles/app.less');

window.addEventListener('load', () => {
    const TreeListDemoElement = React.createElement(TreeListDemo);

    ReactDOM.render(
        TreeListDemoElement,
        document.getElementById('tree-list-container')
    );
});
