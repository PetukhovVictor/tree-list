export const TreeListDemoServices = {
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
