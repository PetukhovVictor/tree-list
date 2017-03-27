import * as React from 'react';

import {TreeList} from 'Components/TreeList';

import {TreeListDemoServices} from './Services';

/**
 * Путь к JSON-файлу, содержащему структуру древовидного списка,
 * по которой будет происходить отрисовка.
 *
 * @type {string}
 */
const treeListSourceUrl = '/assets/resources/tree_list.json';

/**
 * Callback-функция, реализующая шаблон для элемента дерева.
 *
 * @param item - Объект элемента дерева.
 * Содержит помимо всех полей из источника несколько служебных полей:
 *      - _directChildrenNumber - количество "прямых" наследников элемента;
 *      - _allChildrenNumber - количество всех наследников элемента (учитывая вложенность).
 * @param handles - Объект с обработчиками событий, связанных с элементом.
 * Содержит следующие события:
 *      - click - клик по элементу, порождает разворачивание и показ дочерних элементов;
 *      - mouseEnter - наведение мыши на элемент или переход к элементу посредством нажатия стрелок "вверх"/"вниз";
 *      - mouseLeave - уведение курсора от элемента или переход с помощью стрелок к другому элементу.
 * События mouseEnter и mouseLeave реализуют клавиатурную навигацию по дереву и должны вызваться по событиям onMouseEnter и onMouseLeave.
 *
 * @return {JSX.Element}
 */
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

/**
 * TreeListDemo - компонент для демонстрации работы древовидного списка.
 */
export const TreeListDemo = React.createClass({
    displayName: 'TreeListDemo',

    /**
     * Начальное состояние компонента.
     *
     * isLoading - флаг, указывающий на то, загружается ли дерево в настоящий момент.
     * structure - загруженная структура дерева.
     */
    getInitialState () {
        return {
            isLoading: true,
            structure: null
        };
    },

    /**
     * После монтирования компонента стартуем загрузку структуры дерева.
     * По окочании загрузки - записываем результат в state.
     */
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

    /**
     * В зависимости от состояния загрузки рендерим либо лоадер, либо компонент древовидного списка.
     *
     * @return {JSX.Element}
     */
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
