/**
 * Обертка для удобной работы с API Tree list.
 */
export const TreeListAPI = {
    _dispatch: (name, params) => {
        params = params || {};
        document.dispatchEvent(
            new CustomEvent(name, {
                detail: params
            })
        );
    },

    /**
     * Active items API. Установка активного элемента.
     * params:
     *      - id - Идентификатор элемента;
     *      - expandIntermediateItems (опционально, по умолчанию - true) - Осуществить ли автоматическое разворачивание всех потомков указанного элемента;
     *      - scrollToParent - (опционально, по умолчанию - true) - Осуществить ли автоматическое пролистывание не к самому элементу, а к его ближайшему родителю;
     *      - scrollAnimation - (опционально, по умолчанию - true) - Использовать ли плавное пролистывание;
     */
    setActiveItem: (params) => {
        TreeListAPI._dispatch('navigationSetActiveItem', params);
    },

    /**
     * Search API. Запуск поиска по указанной фразе.
     * params:
     *      - phrase - поисковая фраза;
     *      - isStrict (опционально) - использовать ли строгое совпадение (в противном случае будет использоваться поиск по подстроке).
     */
    search: (params) => {
        TreeListAPI._dispatch('navigationSearch', params);
    },

    /**
     * Сброс активного элемента.
     */
    resetActiveItem: () => {
        TreeListAPI._dispatch('navigationResetActiveItem');
    },

    /**
     * Сброс результатов поиска.
     */
    searchReset: () => {
        TreeListAPI._dispatch('navigationSearchReset');
    }
};
