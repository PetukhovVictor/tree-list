import {isUndefined} from 'lodash';

let state = {};

/**
 * PersistState - персистентное хранилище состояний react-компонент.
 * Это простое key-value хранилище, необходимое для "консервирования" состояния react-компонент
 * и дальнейшего его восстановления.
 */
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
