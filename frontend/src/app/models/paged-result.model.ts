export interface PagedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
