import { FetchMiddleware } from "./index";
declare const _default: {
    before: (middlewares: FetchMiddleware[], settings: RequestInfo, options?: RequestInit | undefined) => void;
    done: (middlewares: FetchMiddleware[], args: any[], callback: (newResponse: any) => void) => void;
    fail: (middlewares: FetchMiddleware[], args: any[], callback: () => void) => void;
};
export default _default;
