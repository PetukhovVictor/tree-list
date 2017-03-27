import * as React from 'react';

import {TreeList} from 'Components/TreeList';

import {TreeListDemoServices} from './Services';

const treeListSourceUrl = '/assets/resources/tree_list.json';

const itemTemplate = (item, handles) => {
    return (
        <a
            href={item._allChildrenNumber !== 0 ? '#' : item.url}
            onClick={item._allChildrenNumber == 0 ? null : handles.click}
            onMouseEnter={handles.mouseEnter}
            onMouseLeave={handles.mouseLeave}
            className="page-item-title"
        >
            {item.title}
        </a>
    )
};

export const TreeListDemo = React.createClass({
    displayName: 'TreeListDemo',

    getInitialState () {
        return {
            isLoading: true,
            structure: null
        };
    },

    componentDidMount () {
        TreeListDemoServices.loadFromJSON(treeListSourceUrl).then(treeListStructure => {
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
                {
                    isLoading ?
                        <div className="tree-list-loading"></div> :
                        <TreeList structure={structure} itemTemplate={itemTemplate} />
                }
            </div>
        );
    }
});
