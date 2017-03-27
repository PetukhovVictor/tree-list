import * as React from 'react';
import {isArray, clone, cloneDeep} from 'lodash';
import $ from 'jquery';

require('Styles/Components/TreeList.less');

import {TreeListItemsGroup} from './TreeListItemsGroup';

const itemDefaultTemplate = (item, handles) => {
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

export const TreeList = React.createClass({
    displayName: 'TreeList',

    propTypes: {
        // Структура древовидного списка.
        structure: React.PropTypes.array,
        searchTimeout: React.PropTypes.number
    },

    getDefaultProps: function() {
        return {
            searchTimeout: 1000,
            itemTemplate: itemDefaultTemplate
        };
    },

    getInitialState () {
        const indexedStructure = this.structureIndexing(
            this.props.structure,
            [],
            { childrenCounters: [], indexedStructure: [] }
        ).indexedStructure;

        return {
            searchTimer: null,
            filteredStructure: null,
            indexedStructure: indexedStructure,
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
            this.setActiveItem(detail.id, {
                expandIntermediateItems: detail.expandIntermediateItems !== false,
                scrollToParent: detail.scrollToParent !== false,
                scrollAnimation: detail.scrollAnimation !== false,
            });
        });
        document.addEventListener('navigationResetActiveItem', (e) => this.resetActiveItem());
        document.addEventListener('navigationSearchReset', (e) => this.searchReset());
    },

    componentDidMount () {
        this.APIInit();
    },

    itemAppendChildInfo (item, structureElement) {
        item._directChildrenNumber = structureElement.directChildrenNumber;
        item._allChildrenNumber = structureElement.allChildrenNumber;
    },

    structureIndexing (structure, path, indexedStructureInfo) {
        let ISI = indexedStructureInfo;

        structure.forEach((item, index) => {
            ISI.indexedStructure[item.id] = {
                path: path,
                index: index,
                directChildrenNumber: isArray(item.pages) ? item.pages.length : 0
            };

            ISI.childrenCounters = ISI.childrenCounters.map((counter) => counter + 1);
            ISI.childrenCounters.push(0);

            if (isArray(item.pages)) {
                let currentPath = clone(path);
                currentPath.push(item.id);
                ISI = this.structureIndexing(item.pages, currentPath, ISI);
            }

            ISI.indexedStructure[item.id].allChildrenNumber = ISI.childrenCounters.pop();

            this.itemAppendChildInfo(item, ISI.indexedStructure[item.id]);
        });

        return ISI;
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

    setActiveItem(id, params) {
        const {indexedStructure} = this.state;
        let activeItem = { id };

        if (params.expandIntermediateItems) {
            activeItem.location = cloneDeep(indexedStructure[id]);
        }

        const targetItemIdToScroll = params.scrollToParent && params.expandIntermediateItems ?
            activeItem.location.path[activeItem.location.path.length - 1] :
            activeItem.id;

        this.setState({ activeItem }, () => {
            if (!params.expandIntermediateItems) {
                return;
            }

            const searchInputHeight = $('#tree-list-search').outerHeight();
            const scrollTop = $(`*[id="tree-list-${targetItemIdToScroll}"]`).offset().top - searchInputHeight;

            if (params.scrollAnimation) {
                $('html, body').animate({ scrollTop }, 1000);
            } else {
                $('html, body').scrollTop(scrollTop);
            }
        });
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
        const {structure, itemTemplate} = this.props;
        const {filteredStructure, highlightRule, activeItem} = this.state;
        const targetStructure = filteredStructure || structure;
        let sectionElements = [];

        targetStructure.forEach((section) => {
            sectionElements.push(
                <TreeListItemsGroup
                    key={section.id}
                    itemTemplate={itemTemplate}
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
                <input type="text" id="tree-list-search" onKeyUp={this.handleSearchPhraseTyping} className="tree-list-search" />
                {this.renderSections()}
            </div>
        );
    }
});
