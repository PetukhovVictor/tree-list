import {isUndefined} from 'lodash';

let state = {};

export const PersistState = {
    set(id, data) {
        state[id] = data;
    },
    get(id) {
        return state[id];
    },
    remove(id) {
        delete state[id];
    }
};
