import { FetchMiddleware } from "./index";
export declare type Method = "fail" | "then";
export declare type FilterCallback = (dataOrReason: Response | any, settings: RequestInfo, rejectOrResolve: (reasonOrData: any) => void, next: Function) => void;
declare const _default: {
    before: (middlewares: FetchMiddleware[], settings: RequestInfo, options?: RequestInit | undefined) => void;
    done: (middlewares: FetchMiddleware[], args: any[], callback: () => void) => void;
    fail: (middlewares: FetchMiddleware[], args: any[], callback: () => void) => void;
};
export default _default;
