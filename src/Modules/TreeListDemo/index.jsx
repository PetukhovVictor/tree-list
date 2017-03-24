import * as React from 'react';

import {TreeList} from 'Components/TreeList';

import {TreeListDemoServices} from './Services';

export const TreeListDemo = React.createClass({
    displayName: 'TreeListDemo',

    sourceUrl: '/assets/resources/tree_list.json',

    getInitialState () {
        return {
            isLoading: true,
            structure: null
        };
    },

    componentDidMount () {
        TreeListDemoServices.loadFromJSON(this.sourceUrl).then(treeListStructure => {
            this.setState({
                isLoading: false,
                structure: treeListStructure
            });
        }).catch(() => {
            this.setState({
                isLoading: false
            });
        });
    },

    render () {
        const {isLoading, structure} = this.state;
        return (
            <div>
                {isLoading ? 'Loading...' : <TreeList structure={structure} />}
            </div>
        );
    }
});
