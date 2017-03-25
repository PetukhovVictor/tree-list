import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {isArray, isFunction} from 'lodash';
import classNames from 'classnames';
import $ from 'jquery';

require('Styles/Components/TreeList.less');

export const TreeListItemsGroup = React.createClass({
    propTypes: {
        expandable: React.PropTypes.bool,
        expanded: React.PropTypes.bool,
        classes: React.PropTypes.array,
        item: React.PropTypes.object.isRequired
    },

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

    hasChildren () {
        const pages = this.props.item.pages;

        return isArray(pages) && pages.length !== 0;
    },

    handleItemClick (e) {
        e.preventDefault();
        let {expanded} = this.state;
        const slideToggle = (callback) => {
            const el = findDOMNode(this.refs['children-pages']);
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
            setState(slideToggle);
        }
    },

    renderItems (pages) {
        let pageElements = [];

        pages.forEach((page, index) => {
            pageElements.push(
                <TreeListItemsGroup item={page} />
            );
        });

        return pageElements;
    },

    renderTitle () {
        const {expandable, item} = this.props;
        const hasChildren = this.hasChildren();
        let titleElement;

        if (!expandable && hasChildren) {
            titleElement = (
                <span className="page-item-title">{item.title}</span>
            );
        } else {
            titleElement = (
                <a href="#" onClick={this.handleItemClick} className="page-item-title">{item.title}</a>
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
            'expanded': expanded && !isExpandingDown,
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
