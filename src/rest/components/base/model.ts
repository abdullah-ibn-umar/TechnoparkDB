export default class BaseModel<ModelInterface> {
    /**
     * Insert data in Database table
     * @param data
     */
    create(data: ModelInterface) {
    }

    /**
     * Select data from Database table
     * @param data
     */
    read(data: any) {
    }
    update(data: ModelInterface) {}
}
