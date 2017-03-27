import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {isArray, isFunction, isUndefined, isNull} from 'lodash';
import classNames from 'classnames';
import $ from 'jquery';

import {PersistState} from 'Utils/PersistState';

require('Styles/Components/TreeList.less');

/**
 * Компонент группы элементов древовидного списка.
 */
export const TreeListItemsGroup = React.createClass({
    displayName: 'TreeListItemsGroup',

    /**
     * expandable - является ли группа элементов разворачиваемой;
     * expanded - является ли группа элементов развернутой по умолчанию;
     * classes - дополнительные css-классы, которыми необходимо маркировать группы элементов;
     * item - элемент структуры дерева (элемент + все его наследники), соответствующий текущей группе элементов;
     * highlightRule - правило для выделения элементов дерева.
     *      Содержит:
     *          - field - поле, по которому производится поиск;
     *          - value - значение указанного поля, элементы с которым должны быть выделены;
     *          - isStrict - использовать ли строгое совпадение (в противном случае будет использоваться поиск по подстроке).
     * activeItem - активный элемент дерева (выделяется полужирным).
     *      Содержит:
     *          - id - идентификатор элемента дерева, который нужно поменить активным;
     *          - location - местоположение элемента (опциональное поле, используется для автоматического разворачивания родительских элементов);
     *              - path - путь (массив с родительскими элементами) к элементу;
     *              - index - порядковый номер в списке элементов ближайшего родителя;
     * itemTemplate - callback-функция, реализующая шаблон для элемента дерева.
     */
    propTypes: {
        expandable: React.PropTypes.bool,
        expanded: React.PropTypes.bool,
        classes: React.PropTypes.array,
        item: React.PropTypes.object.isRequired,
        highlightRule: React.PropTypes.object,
        activeItem: React.PropTypes.object,
        itemTemplate: React.PropTypes.func.isRequired
    },

    /**
     * Префикс ключа для "консервирования" локального state в персистентном хранилище состояний.
     */
    persistStateKeyPrefix: 'navigation_item_',

    /**
     * Перечень полей локального state, которые необходимо так же хранить в персистентном хранилище состояний.
     */
    persistStateItems: ['expanded'],

    getDefaultProps: function() {
        return {
            expandable: true,
            expanded: false
        };
    },

    /**
     * expanded - является ли группа элементов развернутой по умолчанию;
     * activeItem - активный элемент дерева (выделяется полужирным).
     *      Содержит:
     *          - id - идентификатор элемента дерева, который нужно поменить активным;
     *          - location - местоположение элемента (опциональное поле, используется для автоматического разворачивания родительских элементов);
     *              - path - путь (массив с родительскими элементами) к элементу;
     *              - index - порядковый номер в списке элементов ближайшего родителя;
     *      activeItem хранится в том числе в локальном state, т. к. в последствии он меняется.
     * isExpandingDown - флаг, указывающий на то, что в данный момент происходит сворачивание группы элементов.
     */
    getInitialState () {
        return {
            expanded: this.props.expanded,
            activeItem: this.props.activeItem,
            isExpandingDown: false
        };
    },

    /**
     * Перед монтированием компоненты достаем "законсервированный" локальный state из персистентного хранилища состояний,
     * а также маркируем группу как развернутую, если она содержится в пути к выбранному активному элементу
     * (иначе говоря - прокладываем путь к вбыранному активному элементу).
     */
    componentWillMount () {
        const {item:{id}} = this.props;
        const persistState = PersistState.get(`${this.persistStateKeyPrefix}${id}`);

        !isUndefined(persistState) && this.setState(persistState);
        this.expandWhenPartPathToActiveItem();
    },

    /**
     * После каждого обновления компонента синхронизируем её локальный state со state'ом, хранящимся в персистентном хранилище состояний,
     * а также маркируем группу как развернутую, если она содержится в пути к выбранному активному элементу.
     */
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

    /**
     * Проверка, является ли текущая группа элементов частью пути к выбранному активном элементу.
     *
     * @return {boolean}
     */
    isPartPathToActiveItem () {
        const {item:{id: itemId}, activeItem} = this.props;

        return !isNull(activeItem) && !isUndefined(activeItem.location) && activeItem.location.path.includes(itemId);
    },

    /**
     * Маркирование группы как развернутой, если она содержится в пути к выбранному активному элементу.
     */
    expandWhenPartPathToActiveItem () {
        const {item:{id: itemId}, activeItem} = this.props;

        if (this.isPartPathToActiveItem()) {
            const indexInPathToActiveItem = activeItem.location.path.indexOf(itemId);
            activeItem.location.path.splice(indexInPathToActiveItem, 1);
            this.setState({ expanded: true, activeItem });
        }
    },

    /**
     * Проверка, не является ли группа элементов пустой.
     *
     * @return {boolean}
     */
    hasChildren () {
        const {item:{pages}} = this.props;

        return isArray(pages) && pages.length !== 0;
    },

    /**
     * Выделение заголовка элемента в соответствии с переданным правилом.
     *
     * @param item - элемент, заголовок которого или его часть должны быть выделены, если требуется;
     * @param rule - правило для выделения элементов дерева.
     *      Содержит:
     *          - field - поле, по которому производится поиск;
     *          - value - значение указанного поля, элементы с которым должны быть выделены;
     *          - isStrict - использовать ли строгое совпадение (в противном случае будет использоваться поиск по подстроке).
     *
     * @return {string|JSX.Element|JSX.Element[]}
     */
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

    /**
     * Маркировка элемента как активного, если требуется.
     *
     * @param item - элемент, который необходимо пометить, как активный, если требуется.
     * @param activeItem - информация о вбыранном активном элементе дерева.
     *      Содержит:
     *          - id - идентификатор элемента дерева, который нужно поменить активным;
     *          - location - местоположение элемента (опциональное поле, используется для автоматического разворачивания родительских элементов);
     *              - path - путь (массив с родительскими элементами) к элементу;
     *              - index - порядковый номер в списке элементов ближайшего родителя;
     *
     * @return {JSX.Element}
     */
    markActiveItem(item, activeItem) {
        return item.id == activeItem.id ? <b>{item.title}</b> : null;
    },

    /**
     * Переключение состояния группы элементов: сворачивание или разворачивание.
     *
     * @param isExpand - флаг, указывающий на то, нужно ли развернуть группу элементов (false, если свернуть).
     */
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

    /**
     * Обработчик события наведения мыши на элемент или перехода к элементу посредством нажатия стрелок "вверх"/"вниз";
     * При наведении осуществляется назначение обработчика для клавиатурной навигации по дереву.
     * Стрелка влево сворачивает группу элементов, вправо - разворачивает.
     */
    handleMouseEnter () {
        $(document).bind('keydown', (e) => {
            const {expanded} = this.state;
            e.keyCode == 39 && !expanded && this.toggleItem(false);
            e.keyCode == 37 && expanded && this.toggleItem(true);
        })
    },

    /**
     * Обработчик события уведения курсора от элемента или перехода с помощью стрелок к другому элементу.
     * При уведении курсора осуществляется сброс обработчика для клавиатурной навигации по дереву.
     */
    handleMouseLeave () {
        $(document).unbind('keydown');
    },

    /**
     * Обработчик события клика по элементу, порождает разворачивание и показ дочерних элементов или сворачивание.
     */
    handleItemClick (e) {
        e.preventDefault();
        const {expanded} = this.state;

        this.toggleItem(expanded);
    },

    /**
     * Рендеринг дочерних групп элементов.
     *
     * @param pages - массив страниц - дочерних элементов дерева.
     *
     * @return {JSX.Element[]}
     */
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

    /**
     * Рендеринг заголовка группы элементов.
     * Заголовок рендерится в соответствии с установленным и переданным шаблоном.
     *
     * @return {JSX.Element}
     */
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
