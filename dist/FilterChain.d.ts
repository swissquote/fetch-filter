import { FetchFilter } from "./index";
declare const _default: {
    before: (filters: FetchFilter[], settings: RequestInfo, options?: RequestInit | undefined) => void;
    done: (filters: FetchFilter[], args: any[], callback: (newResponse: any) => void) => void;
    fail: (filters: FetchFilter[], args: any[], callback: () => void) => void;
};
export default _default;
