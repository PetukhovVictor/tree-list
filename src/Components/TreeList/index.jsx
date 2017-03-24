import * as React from 'react';

import {isArray} from 'lodash';

export const TreeList = React.createClass({
    propTypes: {
        // Структура древовидного списка.
        structure: React.PropTypes.array
    },

    getInitialState () {
        return {

        };
    },

    renderPages (pages) {
        let pageElements = [];

        pages.forEach((page) => {
            pageElements.push(
                <div>
                    {page.title}
                </div>
            );
        });

        return pageElements;
    },

    renderSections () {
        const {structure} = this.props;
        let sectionElements = [];

        structure.forEach((section) => {
            let pages;
            if (isArray(section.pages)) {
                pages = this.renderPages(section.pages);
            }
            sectionElements.push(
                <div>
                    {section.title}
                    {pages && <div className="pages">{pages}</div>}
                </div>
            );
        });

        return sectionElements;
    },

    render () {
        return (
            <div>
                {this.renderSections()}
            </div>
        );
    }
});
