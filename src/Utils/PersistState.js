let state = {};

export const PersistState = {
    set(id, data) {
        return new Promise((resolve, reject) => {
            state[id] = data;
            resolve();
        });
    },
    get(id) {
        return new Promise((resolve, reject) => {
            resolve(state[id]);
        });
    },
    remove(id) {
        return new Promise((resolve, reject) => {
            delete state[id];
            resolve();
        });
    }
};
