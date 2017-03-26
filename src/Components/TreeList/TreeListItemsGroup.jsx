import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {isArray, isFunction, isUndefined} from 'lodash';
import classNames from 'classnames';
import $ from 'jquery';

import {PersistState} from 'Utils/PersistState';

require('Styles/Components/TreeList.less');

export const TreeListItemsGroup = React.createClass({
    propTypes: {
        expandable: React.PropTypes.bool,
        expanded: React.PropTypes.bool,
        classes: React.PropTypes.array,
        item: React.PropTypes.object.isRequired,
        highlightRule: React.PropTypes.object,
        activeItem: React.PropTypes.string
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
            isExpandingDown: false
        };
    },

    componentDidMount () {
        const {item:{id}} = this.props;

        PersistState.get(`${this.persistStateKeyPrefix}${id}`).then((persistState) => {
            !isUndefined(persistState) && this.setState(persistState);
        });
    },

    componentDidUpdate() {
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
        return item.id == activeItem ? <b>{item.title}</b> : null;
    },

    handleItemClick (e) {
        e.preventDefault();
        let {expanded} = this.state;
        const slideToggle = (callback, preHide) => {
            preHide = preHide || false;
            const el = findDOMNode(this.refs['children-pages']);
            preHide && $(el).hide();
            $(el).slideToggle(() => isFunction(callback) && callback());
        };
        const setState = (callback) => {
            this.setState({
                expanded: !expanded,
                isExpandingDown: false
            }, () => isFunction(callback) && callback());
        };

        if (expanded) {
            this.setState({ isExpandingDown: true });
            slideToggle(setState);
        } else {
            setState(() => slideToggle(null, true));
        }
    },

    renderItems (pages) {
        const {highlightRule, activeItem} = this.props;
        let pageElements = [];

        pages.forEach((page, index) => {
            pageElements.push(
                <TreeListItemsGroup
                    key={page.id}
                    item={page}
                    highlightRule={highlightRule}
                    activeItem={activeItem}
                />
            );
        });

        return pageElements;
    },

    renderTitle () {
        const {expandable, item, highlightRule, activeItem} = this.props;
        const hasChildren = this.hasChildren();
        let titleElement;

        if (!expandable && hasChildren) {
            titleElement = (
                <span className="page-item-title">{item.title}</span>
            );
        } else {
            let itemTitle = item.title;
            if (highlightRule !== null) {
                itemTitle = this.highlight(item, highlightRule);
            }
            if (activeItem !== null) {
                itemTitle = this.markActiveItem(item, activeItem) || itemTitle;
            }
            titleElement = (
                <a href="#" onClick={this.handleItemClick} className="page-item-title">{itemTitle}</a>
            );
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
            <div className={classNames(classes, externalClasses)} key={`page`}>
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
