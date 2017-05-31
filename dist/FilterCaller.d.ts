import { XHRFilter } from "./index";
export declare type Method = "fail" | "then";
export declare type FilterCallback = (dataOrReason: Response | any, settings: RequestInfo, rejectOrResolve: (reasonOrData: any) => void, next: Function) => void;
export default class FilterCaller {
    /**
     * Array of installed filters
     */
    filters: XHRFilter[];
    /**
     * Utility method to call all filters in the correct order.
     *
     * @param filters All filters implementations
     * @constructor
     */
    constructor(filters: XHRFilter[]);
    /**
     * Filters to run before the XHR Request.
     *
     * The order of the filters is reversed
     *
     * @param args The arguments to pass to the methods
     */
    before(settings: RequestInfo, options?: RequestInit): void;
    /**
     * Filters to run when a request succeeded
     *
     * @param args The arguments to pass to the methods
     * @param callback The callback to execute after all filters are run
     */
    done(args: any[], callback: () => void): void;
    /**
     * Filters to run when a request succeeded
     *
     * @param args The arguments to pass to the methods
     * @param callback The callback to execute after all filters are run
     */
    fail(args: any[], callback: () => void): void;
    protected getValidMethods(method: "then" | "fail" | "before"): ((...args: any[]) => void)[];
    /**
     * Execute the next method
     */
    protected next(args: any[], fns: ((...args: any[]) => void)[], callback: () => void): void;
}
