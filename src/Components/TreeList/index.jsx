import * as React from 'react';
import {isArray} from 'lodash';

require('Styles/Components/TreeList.less');

import {TreeListItemsGroup} from './TreeListItemsGroup';

export const TreeList = React.createClass({
    propTypes: {
        // Структура древовидного списка.
        structure: React.PropTypes.array,
        searchTimeout: React.PropTypes.number
    },

    getDefaultProps: function() {
        return {
            searchTimeout: 1000
        };
    },

    getInitialState () {
        return {
            searchTimer: null,
            filteredStructure: null
        };
    },

    search (phrase) {

    },

    handleSearchPhraseTyping (e) {
        const {searchTimeout} = this.props;
        const {searchTimer} = this.state;
        const value = e.target.value;

        searchTimer != null && clearTimeout(searchTimer);

        const timer = setTimeout(() => this.search(value), searchTimeout);
        this.setState({ searchTimer: timer });
    },

    renderSections () {
        const {structure} = this.props;
        let sectionElements = [];

        structure.forEach((section, index) => {
            sectionElements.push(
                <TreeListItemsGroup
                    item={section}
                    expandable={false}
                    expanded
                    classes={['top-level']}
                />
            );
        });

        return sectionElements;
    },

    render () {
        return (
            <div className="tree-list">
                <input type="text" onKeyUp={this.handleSearchPhraseTyping} className="tree-list-search" />
                {this.renderSections()}
            </div>
        );
    }
});
