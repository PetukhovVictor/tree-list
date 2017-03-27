/**
 * Обертка для удобной работы с API Tree list.
 */
export const TreeListAPI = {
    /**
     * Active items API. Установка активного элемента.
     * params:
     *      - id - Идентификатор элемента;
     *      - expandIntermediateItems (опционально, по умолчанию - true) - Осуществить ли автоматическое разворачивание всех потомков указанного элемента;
     *      - scrollToParent - (опционально, по умолчанию - true) - Осуществить ли автоматическое пролистывание не к самому элементу, а к его ближайшему родителю;
     *      - scrollAnimation - (опционально, по умолчанию - true) - Использовать ли плавное пролистывание;
     */
    setActiveItem: (params) => {
        document.dispatchEvent(
            new CustomEvent('navigationSetActiveItem', {
                detail: params
            })
        );
    },
    /**
     * Search API. Запуск поиска по указанной фразе.
     * params:
     *      - phrase - поисковая фраза;
     *      - isStrict (опционально) - использовать ли строгое совпадение (в противном случае будет использоваться поиск по подстроке).
     */
    search: (params) => {
        document.dispatchEvent(
            new CustomEvent('navigationSearch', {
                detail: params
            })
        );
    },
    /**
     * Сброс активного элемента.
     */
    resetActiveItem: (params) => {
        document.dispatchEvent(
            new CustomEvent('navigationResetActiveItem', {
                detail: params
            })
        );
    },
    /**
     * Сброс результатов поиска.
     */
    searchReset: (params) => {
        document.dispatchEvent(
            new CustomEvent('navigationSearchReset', {
                detail: params
            })
        );
    }
};
