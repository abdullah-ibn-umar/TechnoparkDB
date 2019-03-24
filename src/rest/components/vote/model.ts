import db from '../../../config/database';
import {IQuery} from '../base/interfaces';
import BaseModel from '../base/model';
import Interface from './interface';

export default class UserModel implements BaseModel<Interface> {
    constructor() {}

    create(user: Interface) {
    }

    delete(id: number) {
    }

    async update(data: Interface) {
    }

    async read(data: Interface) {
    }
}
