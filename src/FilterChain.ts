
import { FetchFilter } from "./index";

/**
 * Filter to run before the XHR Request.
 *
 * The order of the filters is reversed
 *
 * @param filters All declared filters
 * @param settings The request settings
 * @param options The request options, might be null
 */
function before(filters: FetchFilter[], settings: RequestInfo, options?: RequestInit) {
  const fns: ((settings: RequestInfo, options?: RequestInit) => void)[] = getValidMethods(filters, "before")
  fns.reverse().forEach(fn => fn(settings, options));
}

/**
 * Filter to run when a request succeeded
 *
 * @param filters All declared filters
 * @param args The arguments to pass to the methods
 * @param callback The callback to execute after all filters are run
 */
function done(filters: FetchFilter[], args: any[], callback: (newResponse: any) => void) {
  next(args, getValidMethods(filters, "then"), callback);
}

/**
 * Filter to run when a request succeeded
 *
 * @param filters All declared filters
 * @param args The arguments to pass to the methods
 * @param callback The callback to execute after all filters are run
 */
function fail(filters: FetchFilter[], args: any[], callback: () => void) {
  next(args, getValidMethods(filters, "fail"), callback);
}

/**
 * From all declared filters, take the existing methods
 * 
 * @param filters All declared filters 
 * @param method The method from the filters to take 
 */
function getValidMethods(filters: FetchFilter[], method: "then" | "fail" | "before"): ((...args: any[]) => void)[] {
  return filters
    .filter(filter => filter.hasOwnProperty(method))
    .map(filter => filter[method]) as ((...args: any[]) => void)[];
}

/**
 * Execute the next method
 * 
 * @param args The arguments to pass to the methods
 * @param fns The next functions to call
 * @param callback The callback to execute after all filters are run
 */
function next(args: any[], fns: ((...args: any[]) => void)[], callback: (newResponse: any) => void) {
  const fn = fns[0];
  if (fn) {
    fn(...args, (newResponse: any) => {
      if (newResponse) {
        args[0] = newResponse;
      }
      next(args, fns.slice(1), callback)
    });
  } else {
    callback(args[0]);
  }
}

export default {
  before,
  done,
  fail
}
