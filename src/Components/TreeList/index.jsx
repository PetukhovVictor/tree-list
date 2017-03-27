import * as React from 'react';
import {isArray, clone, cloneDeep} from 'lodash';
import $ from 'jquery';

import {TreeListItemsGroup} from './TreeListItemsGroup';

require('Styles/Components/TreeList.less');

/**
 * Callback-функция по умолчанию, реализующая шаблон для элемента дерева.
 *
 * @param item - Объект элемента дерева.
 * Содержит помимо всех полей из источника несколько служебных полей:
 *      - _directChildrenNumber - количество "прямых" наследников элемента;
 *      - _allChildrenNumber - количество всех наследников элемента (учитывая вложенность).
 * @param handles - Объект с обработчиками событий, связанных с элементом.
 * Содержит следующие события:
 *      - click - клик по элементу, порождает разворачивание и показ дочерних элементов;
 *      - mouseEnter - наведение мыши элемент или переход к элементу посредством нажатия стрелок "вверх"/"вниз";
 *      - mouseLeave - уведение курсора от элемента или переход с помощью стрелок к другому элементу.
 * События mouseEnter и mouseLeave реализуют клавиатурную навигацию по дереву и должны вызваться по событиям onMouseEnter и onMouseLeave.
 *
 * @return {JSX.Element}
 */
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

/**
 * Компонент древовидного списка.
 */
export const TreeList = React.createClass({
    displayName: 'TreeList',

    /**
     * structure - структура древовидного списка;
     * searchTimeout - задержка перед началом поиска после окончания ввода пользователем поисковой фразы.
     */
    propTypes: {
        structure: React.PropTypes.array,
        searchTimeout: React.PropTypes.number
    },

    getDefaultProps: function() {
        return {
            searchTimeout: 500,
            itemTemplate: itemDefaultTemplate
        };
    },

    /**
     * Начальные значения state.
     * В момент установки начальных значений state, инициируем индексацию структуры древовидного списка.
     *
     * searchTimer - переменная для хранения таймера от окончания ввода поисковой фразы до запуска поиска.
     * filteredStructure - отфильтрованная и линеаризованная структура древовидного списка (используется для поиска).
     * indexedStructure - проиндексированная структура древовидного списка (карта).
     *      Структура содержит:
     *          - location - местоположение элемента;
     *              - path - путь (массив с родительскими элементами) к элементу;
     *              - index - порядковый номер в списке элементов ближайшего родителя;
     *          - directChildrenNumber - количество "прямых" наследников элемента;
     *          - allChildrenNumber - количество всех наследников элемента (учитывая вложенность).
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
     */
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

    /**
     * Инициализация API.
     * Реализация API подразумевает использование listener'ов.
     * Вызов метода API происходит с помощью dispatchEvent.
     * Пример:
     *      document.dispatchEvent(
     *          new CustomEvent('navigationSetActiveItem', {
     *              detail: {
     *                  id: 'procedures.developingcode.cut',
     *                  expandIntermediateItems: true,
     *                  scrollAnimation: true,
     *                  scrollToParent: true
     *              }
     *          })
     *      );
     * TODO: Написать класс-обертку для более красивого вызова методов API.
     */
    APIInit () {
        /**
         * Search API. Запуск поиска по указанной фразе.
         * Параметры:
         *      - phrase - поисковая фраза;
         *      - isStrict (опционально) - использовать ли строгое совпадение (в противном случае будет использоваться поиск по подстроке).
         */
        document.addEventListener('navigationSearch', (e) => {
            const detail = e.detail;
            if (!detail || !detail.phrase) {
                throw new Error('Search phrase is not defined.');
            }
            detail.field = detail.field || 'title';
            detail.isStrict = detail.isStrict || false;
            this.search(detail.phrase, detail.field, detail.isStrict);
        });
        /**
         * Active items API. Установка активного элемента.
         * Параметры:
         *      - id - Идентификатор элемента;
         *      - expandIntermediateItems (опционально, по умолчанию - true) - Осуществить ли автоматическое разворачивание всех потомков указанного элемента;
         *      - scrollToParent - (опционально, по умолчанию - true) - Осуществить ли автоматическое пролистывание не к самому элементу, а к его ближайшему родителю;
         *      - scrollAnimation - (опционально, по умолчанию - true) - Использовать ли плавное пролистывание;
         */
        document.addEventListener('navigationSetActiveItem', (e) => {
            const detail = e.detail;
            if (!detail || !detail.id) {
                throw new Error('Id element is not defined.');
            }
            this.setActiveItem(detail.id, {
                expandIntermediateItems: detail.expandIntermediateItems !== false,
                scrollToParent: detail.scrollToParent !== false,
                scrollAnimation: detail.scrollAnimation !== false
            });
        });
        /**
         * Сброс активного элемента.
         */
        document.addEventListener('navigationResetActiveItem', (e) => this.resetActiveItem());
        /**
         * Сброс результатов поиска.
         */
        document.addEventListener('navigationSearchReset', (e) => this.searchReset());
    },

    /**
     * Инициализируем API сразу после монтирования компоненты.
     */
    componentDidMount () {
        this.APIInit();
    },

    /**
     * Добавление к объекту элемента дерева служебных полей:
     *       - directChildrenNumber - количество "прямых" наследников элемента;
     *       - allChildrenNumber - количество всех наследников элемента (учитывая вложенность).
     *
     * @param item - Элемент дерева.
     * @param structureElement - Элемент проидексированной структуры, соответствующий указанному элементу.
     */
    itemAppendChildInfo (item, structureElement) {
        item._directChildrenNumber = structureElement.directChildrenNumber;
        item._allChildrenNumber = structureElement.allChildrenNumber;
    },

    /**
     * Индексирование структуры древовидного списка.
     *
     * Индексирование подразумевает создание линейной hash map вида:
     *      '{element_id}': {
     *          path: array,
     *          index: number,
     *          directChildrenNumber: number,
     *          allChildrenNumber: number
     *      }
     *
     * Индексирование позволяет в дальнейшем очень быстро находить местоположение элемента в дереве,
     * а также получать некоторую другую информацию без дополнительных вычислений (например, кол-во дочерних элементов).
     *
     * @param structure - изначальная структура древовидного списка;
     * @param path - путь к просматриваемому элементу дерева;
     * @param indexedStructureInfo - часть проиндексированной структуры дерева.
     *
     * @return { indexedStructure, childrenCounters }
     */
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

    /**
     * Сброс результатов поиска по дереву.
     */
    searchReset () {
        this.setState({
            filteredStructure: null,
            highlightRule: null
        });
    },

    /**
     * Сброс ранее установленного активного элемента дерева.
     */
    resetActiveItem () {
        this.setState({
            activeItem: null
        });
    },

    /**
     * Фильтрация элементов дерева.
     * 
     * @param params - параметры фильтрации. Содержит:
     *      - field - поле, по которому производится фильтрация;
     *      - value - значение указанного поля, элементы с которым будут отобраны;
     *      - isStrict - использовать ли строгое совпадение (в противном случае будет использоваться поиск по подстроке).
     * @param elements - просматриваемый кусок структуры с элементами, над которыми производится фильтраци.
     * @param filteredElements - часть массива с отфильтрованными элементами.
     *
     * @return filteredElements - массив с отфильтрованными элементами.
     */
    filterElements (params, elements, filteredElements) {
        params.isStrict = params.isStrict || false;
        const filteredElementsCurrentLevel = elements
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
        filteredElements = filteredElements.concat(filteredElementsCurrentLevel);
        if (params.isStrict && filteredElements.length > 0) {
            return filteredElements;
        }
        elements.every((page) => {
            if (isArray(page.pages)) {
                filteredElements =  this.filterElements(params, page.pages, filteredElements);
            }
            return !params.isStrict || filteredElements == 0;
        });
        return filteredElements;
    },

    /**
     * Поиск элементов в дереве.
     * В результате поиска осуществляет запись в state отфильтрованной структуры и правила для выделения заголовков элементов или их частей.
     *
     * @param phrase - поисковая фраза, по которой будут отобраны элементы;
     * @param field - поле, по которому производится фильтрация;
     * @param isStrict - использовать ли строгое совпадение (в противном случае будет использоваться поиск по подстроке).
     */
    search (phrase, field, isStrict) {
        const {structure} = this.props;
        let filteredStructure = [];

        if (phrase === '') {
            this.searchReset();
            return;
        }

        structure.forEach((section) => {
            if (isArray(section.pages)) {
                const filteredElements = this.filterElements({
                    value: phrase,
                    field: field,
                    isStrict: isStrict
                }, section.pages, []);
                if (filteredElements.length > 0) {
                    const filteredSection = clone(section);
                    filteredSection.pages = filteredElements;
                    filteredStructure.push(filteredSection);
                }
            }
        });

        this.setState({
            filteredStructure: filteredStructure,
            highlightRule: {
                field: field,
                value: phrase,
                isStrict: isStrict
            }
        });
    },

    /**
     * Выбор активного элемента.
     *
     * @param id - идентификатор элемента;
     * @param params - параметры выбора элемента. Содержит:
     *      - expandIntermediateItems - осуществить ли автоматическое разворачивание всех потомков указанного элемента;
     *      - scrollToParent - осуществить ли автоматическое пролистывание не к самому элементу, а к его ближайшему родителю;
     *      - scrollAnimation - использовать ли плавное пролистывание.
     */
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

    /**
     * Обработчик события ввода поисковой фразы в поле поиска.
     * Запускаем поиск только после окончания ввода (в соответствии с заданным таймаутом).
     */
    handleSearchPhraseTyping (e) {
        const {searchTimeout} = this.props;
        const {searchTimer} = this.state;
        const value = e.target.value;

        searchTimer != null && clearTimeout(searchTimer);

        const timer = setTimeout(() => this.search(value, 'title', false), searchTimeout);
        this.setState({ searchTimer: timer });
    },

    /**
     * Осуществляем рендеринг корневых элементов дерева - разделов.
     * Они отличаются тем, что имеют специальные стили, всегда развернуты и несворачиваемы;
     * по ним не осуществляется поиск и их нельзя выбрать как активные.
     *
     * Для рендеринга групп элементов используем компонент TreeListItemsGroup.
     *
     * @returns {JSX.Element | JSX.Element[]}
     */
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
