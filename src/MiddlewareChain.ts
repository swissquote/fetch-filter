
import { FetchMiddleware } from "./index";

export type Method = "fail" | "then";

export type FilterCallback = (dataOrReason: Response | any, settings: RequestInfo, rejectOrResolve: (reasonOrData: any) => void, next: Function) => void

/**
 * Middleware to run before the XHR Request.
 *
 * The order of the middlewares is reversed
 *
 * @param middlewares All declared middlewares
 * @param settings The request settings
 * @param options The request options, might be null
 */
function before(middlewares: FetchMiddleware[], settings: RequestInfo, options?: RequestInit) {
  const fns: ((settings: RequestInfo, options?: RequestInit) => void)[] = getValidMethods(middlewares, "before")
  fns.reverse().forEach(fn => fn(settings, options));
}

/**
 * Middleware to run when a request succeeded
 *
 * @param middlewares All declared middlewares
 * @param args The arguments to pass to the methods
 * @param callback The callback to execute after all middlewares are run
 */
function done(middlewares: FetchMiddleware[], args: any[], callback: () => void) {
  next(args, getValidMethods(middlewares, "then"), callback);
}

/**
 * Middleware to run when a request succeeded
 *
 * @param middlewares All declared middlewares
 * @param args The arguments to pass to the methods
 * @param callback The callback to execute after all middlewares are run
 */
function fail(middlewares: FetchMiddleware[], args: any[], callback: () => void) {
  next(args, getValidMethods(middlewares, "fail"), callback);
}

/**
 * From all declared middlewares, take the existing methods
 * 
 * @param middlewares All declared middlewares 
 * @param method The method from the middleware to take 
 */
function getValidMethods(middlewares: FetchMiddleware[], method: "then" | "fail" | "before"): ((...args: any[]) => void)[] {
  return middlewares
    .filter(filter => filter.hasOwnProperty(method))
    .map(filter => filter[method]) as ((...args: any[]) => void)[];
}

/**
 * Execute the next method
 * 
 * @param args The arguments to pass to the methods
 * @param fns The next functions to call
 * @param callback The callback to execute after all middlewares are run
 */
function next(args: any[], fns: ((...args: any[]) => void)[], callback: () => void) {
  const fn = fns[0];
  if (fn) {
    fn(...args, () => next(args, fns.slice(1), callback));
  } else {
    callback();
  }
}

export default {
  before,
  done,
  fail
}
