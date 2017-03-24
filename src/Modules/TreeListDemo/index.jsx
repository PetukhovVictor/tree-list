import * as React from 'react';

import {TreeListDemoServices} from './Services';

export const TreeListDemo = React.createClass({
    displayName: 'TreeListDemo',

    sourceUrl: '/assets/resources/tree_list.json',

    getInitialState () {
        return {
            isLoading: true,
            tree: null
        };
    },

    componentDidMount () {
        TreeListDemoServices.loadFromJSON(this.sourceUrl).then(treeListStructure => {
            this.setState({
                tree: treeListStructure
            });
        }).catch(() => {

        });
    },

    render () {
        return (
            <div>666</div>
        );
    }
});
