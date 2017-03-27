export const TreeListDemoServices = {
    /**
     * Сервис - загрузчик данных из JSON-файла по указанному пути.
     *
     * @param path - путь к файлу, который необходимо загрузить.
     *
     * @return {Promise<Object>} Обещание вернуть содержимое файла.
     */
    loadFromJSON (path) {
        return fetch(path).then(
            response => {
                return response.json();
            },
            () => {
                throw 'Error tree list loading!';
            }
        )
    }
};
