import * as React from 'react';
import {isArray, clone, cloneDeep} from 'lodash';

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
            filteredStructure: null,
            highlightRule: null,
            activeItem: null
        };
    },

    APIInit () {
        document.addEventListener('navigationSearch', (e) => {
            const detail = e.detail;
            if (!detail || !detail.phrase) {
                throw new Error('Search phrase is not defined.');
            }
            detail.field = detail.field || 'title';
            detail.isStrict = detail.isStrict || false;
            this.search(detail.phrase, detail.field, detail.isStrict);
        });
        document.addEventListener('navigationSetActiveItem', (e) => {
            const detail = e.detail;
            if (!detail || !detail.id) {
                throw new Error('Id element is not defined.');
            }
            this.setActiveItem(detail.id);
        });
        document.addEventListener('navigationResetActiveItem', (e) => this.resetActiveItem());
        document.addEventListener('navigationSearchReset', (e) => this.searchReset());
    },

    componentDidMount () {
        this.APIInit();
    },

    searchReset () {
        this.setState({
            filteredStructure: null,
            highlightRule: null
        });
    },

    resetActiveItem () {
        this.setState({
            activeItem: null
        });
    },

    filterPages (params, pages, filteredPages) {
        params.isStrict = params.isStrict || false;
        const filteredPagesCurrentLevel = pages
            .filter((page) => {
                return params.isStrict ?
                page[params.field] === params.value :
                page[params.field].match(new RegExp(params.value, 'i')) !== null;
            })
            .map((page) => {
                page = clone(page);
                page.pages = null;
                return page;
            });
        filteredPages = filteredPages.concat(filteredPagesCurrentLevel);
        if (params.isStrict && filteredPages.length > 0) {
            return filteredPages;
        }
        pages.every((page) => {
            if (isArray(page.pages)) {
                filteredPages =  this.filterPages(params, page.pages, filteredPages);
            }
            return !params.isStrict || filteredPages == 0;
        });
        return filteredPages;
    },

    search (phrase, field, isStrict) {
        const {structure} = this.props;
        let filteredStructure = [];

        if (phrase === '') {
            this.searchReset();
            return;
        }

        structure.forEach((section) => {
            if (isArray(section.pages)) {
                const filteredPages = this.filterPages({
                    value: phrase,
                    field: field,
                    isStrict: isStrict
                }, section.pages, []);
                if (filteredPages.length > 0) {
                    const filteredSection = clone(section);
                    filteredSection.pages = filteredPages;
                    filteredStructure.push(filteredSection);
                }
            }
        });

        this.setState({
            filteredStructure: filteredStructure,
            highlightRule: {
                field: field,
                value: phrase,
                isStrict: isStrict,
            }
        });
    },

    setActiveItem(id) {
        this.setState({ activeItem: id });
    },

    handleSearchPhraseTyping (e) {
        const {searchTimeout} = this.props;
        const {searchTimer} = this.state;
        const value = e.target.value;

        searchTimer != null && clearTimeout(searchTimer);

        const timer = setTimeout(() => this.search(value, 'title', false), searchTimeout);
        this.setState({ searchTimer: timer });
    },

    renderSections () {
        const {structure} = this.props;
        const {filteredStructure, highlightRule, activeItem} = this.state;
        const targetStructure = filteredStructure || structure;
        let sectionElements = [];

        targetStructure.forEach((section, index) => {
            sectionElements.push(
                <TreeListItemsGroup
                    key={section.id}
                    highlightRule={highlightRule}
                    activeItem={activeItem}
                    item={section}
                    expandable={false}
                    expanded
                    classes={['top-level']}
                />
            );
        });

        return sectionElements.length == 0 ? <div className="tree-list-no-results">No results</div> : sectionElements;
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
