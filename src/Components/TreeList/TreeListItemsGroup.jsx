import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {isArray, isFunction, isUndefined, isNull} from 'lodash';
import classNames from 'classnames';
import $ from 'jquery';

import {PersistState} from 'Utils/PersistState';

require('Styles/Components/TreeList.less');

export const TreeListItemsGroup = React.createClass({
    displayName: 'TreeListItemsGroup',

    propTypes: {
        expandable: React.PropTypes.bool,
        expanded: React.PropTypes.bool,
        classes: React.PropTypes.array,
        item: React.PropTypes.object.isRequired,
        highlightRule: React.PropTypes.object,
        activeItem: React.PropTypes.object,
        itemTemplate: React.PropTypes.func.isRequired
    },

    persistStateKeyPrefix: 'navigation_item_',
    persistStateItems: ['expanded'],

    getDefaultProps: function() {
        return {
            expandable: true,
            expanded: false
        };
    },

    getInitialState () {
        return {
            expanded: this.props.expanded,
            activeItem: this.props.activeItem,
            isExpandingDown: false
        };
    },

    componentWillMount () {
        const {item:{id}} = this.props;
        const persistState = PersistState.get(`${this.persistStateKeyPrefix}${id}`);

        !isUndefined(persistState) && this.setState(persistState);
        this.expandWhenPartPathToActiveItem();
    },

    componentDidUpdate() {
        this.expandWhenPartPathToActiveItem();

        const {item:{id}} = this.props;
        const state = this.state;
        const persistState = {};

        this.persistStateItems.forEach((item) => {
            if (!isUndefined(state[item])) {
                persistState[item] = state[item];
            }
        });

        PersistState.set(`${this.persistStateKeyPrefix}${id}`, persistState);
    },

    isPartPathToActiveItem () {
        const {item:{id: itemId}, activeItem} = this.props;

        return !isNull(activeItem) && !isUndefined(activeItem.location) && activeItem.location.path.includes(itemId);
    },

    expandWhenPartPathToActiveItem () {
        const {item:{id: itemId}, activeItem} = this.props;

        if (this.isPartPathToActiveItem()) {
            const indexInPathToActiveItem = activeItem.location.path.indexOf(itemId);
            activeItem.location.path.splice(indexInPathToActiveItem, 1);
            this.setState({ expanded: true, activeItem });
        }
    },

    hasChildren () {
        const pages = this.props.item.pages;

        return isArray(pages) && pages.length !== 0;
    },

    highlight (item, rule) {
        if (rule.isStrict && item[rule.field] == rule.value) {
            return <b>{item.title}</b>;
        } else if (!rule.isStrict && rule.field == 'title') {
            return item.title.split(new RegExp(`(${rule.value})`, 'i'))
                .map((textElement, index) => index % 2 == 0 ? textElement : <b key={`item-title-bold-${index}`}>{textElement}</b>);
        } else {
            return item.title;
        }
    },

    markActiveItem(item, activeItem) {
        return item.id == activeItem.id ? <b>{item.title}</b> : null;
    },

    toggleItem (isExpand) {
        const slideToggle = (callback, preHide) => {
            preHide = preHide || false;
            const el = findDOMNode(this.refs['children-pages']);
            preHide && $(el).hide();
            $(el).slideToggle(() => isFunction(callback) && callback());
        };
        const setState = (callback) => {
            this.setState({
                expanded: !isExpand,
                isExpandingDown: false
            }, () => isFunction(callback) && callback());
        };

        if (isExpand) {
            this.setState({ isExpandingDown: true });
            slideToggle(setState);
        } else {
            setState(() => slideToggle(null, true));
        }
    },

    handleMouseEnter () {
        $(document).bind('keydown', (e) => {
            const {expanded} = this.state;
            e.keyCode == 39 && !expanded && this.toggleItem(false);
            e.keyCode == 37 && expanded && this.toggleItem(true);
        })
    },

    handleMouseLeave () {
        $(document).unbind('keydown');
    },

    handleItemClick (e) {
        e.preventDefault();
        const {expanded} = this.state;

        this.toggleItem(expanded);
    },

    renderItems (pages) {
        const {highlightRule, activeItem, itemTemplate} = this.props;
        let pageElements = [];

        pages.forEach((page) => {
            pageElements.push(
                <TreeListItemsGroup
                    key={page.id}
                    item={page}
                    highlightRule={highlightRule}
                    activeItem={activeItem}
                    itemTemplate={itemTemplate}
                />
            );
        });

        return pageElements;
    },

    renderTitle () {
        const {expandable, item, highlightRule, activeItem, itemTemplate} = this.props;
        const hasChildren = this.hasChildren();
        let titleElement;

        if (!expandable && hasChildren) {
            titleElement = (
                <span className="page-item-title">{item.title}</span>
            );
        } else {
            if (highlightRule !== null) {
                item.title = this.highlight(item, highlightRule);
            }
            if (activeItem !== null) {
                item.title = this.markActiveItem(item, activeItem) || item.title;
            }

            titleElement = itemTemplate(item, {
                click: this.handleItemClick,
                mouseEnter: this.handleMouseEnter,
                mouseLeave: this.handleMouseLeave
            });
        }

        return titleElement;
    },

    render () {
        const {item, classes: externalClasses, expandable} = this.props;
        const {expanded, isExpandingDown} = this.state;
        const hasChildren = this.hasChildren();
        const classes = {
            'page-item': true,
            'expandable': expandable && hasChildren,
            'expanded': expanded && !isExpandingDown
        };

        return (
            <div className={classNames(classes, externalClasses)} key={`page`} id={`tree-list-${item.id}`}>
                {this.renderTitle()}
                {
                    expanded && hasChildren && (
                        <div className="children-pages" ref="children-pages">{this.renderItems(item.pages)}</div>
                    )
                }
            </div>
        );
    }
});
