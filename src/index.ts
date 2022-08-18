import filterChain from "./FilterChain";

declare global {
    interface Window {
        addFetchFilter(filter: FetchFilter): void;
    }
}

export interface FetchFilter {
    /**
     * Executed before the request is sent, you may add headers or change the options any way you want
     */
    before?(
        settings: RequestInfo, // Original first parameter set to fetch
        options?: RequestInit  // Original second parameter set to fetch
    ): void;

    /**
     * Executed when the request was successful, you can implement any logic here, even asynchronous.
     *
     * You can call reject(reason) if you decide the request should not pass.
     */
    then?(
        response: Response,    // The response given by Fetch
        settings: RequestInfo, // Original first parameter set to fetch
        options: RequestInit,  // Original second parameter set to fetch
        reject: (reason: any) => void, // Pass from resolved to failed for this promise
        next: (newResponse?: Response) => void // The callback to call when you're done with your business, you can optionally provide a new Response object here that will replace the original response
    ): void;

    /**
     * Executed when the request was successful, you can implement any logic here, even asynchronous.
     *
     * You can call resolve(reponse) if you decide the request should pass.
     */
    fail?(
        reason: any,           // The object you receive from the failed promise
        settings: RequestInfo, // Original first parameter set to fetch
        options: RequestInit,  // Original second parameter set to fetch
        resolve: (response: Response) => void, // Pass from failed to resolved for this request
        next: Function         // The callback to call when you're done with your business
    ): void;
}

var filters: FetchFilter[] = [];

/**
 * Register a new Filter
 *
 * @param filter
 */
window.addFetchFilter = function (filter: FetchFilter) {
    filters.push(filter);
}

const bounceError = "Bouncing between rejected and resolved, stopping loop";

var originalFetch = window.fetch;
window.fetch = function (request: RequestInfo, options?: RequestInit): Promise<Response> {

    return new Promise((resolve, reject) => {
        // ensure an options object exists
        options = options ? options : {};

        // Before filters
        filterChain.before(filters, request, options);

        // Make the actual call
        var innerXHR = originalFetch(request, options);

        innerXHR.then((data: Response) => {
            // This is called when the request is bouncing between rejected and resolved
            const deferredResolveAgain = function () {
                reject(bounceError);
                throw new Error(bounceError);
            };

            // If a filter decides to reject the request, this method is called
            const deferredReject = function (errorThrown: any) {
                filterChain.fail(
                    filters,
                    [errorThrown, request, options, deferredResolveAgain],
                    () => reject(errorThrown)
                );
            };

            filterChain.done(
                filters,
                [data, request, options, deferredReject],
                (response) => resolve(response) // All filters passed, resolve the outer XHR
            );
        });

        innerXHR.catch((errorThrown: any) => {
            // This is called when the request is bouncing between rejected and resolved
            const deferredRejectAgain = function () {
                reject(errorThrown);
                throw new Error(bounceError);
            };

            // If a filter decides to resolve the request, this method is called
            var deferredResolve = function (data: Response) {
                filterChain.done(
                    filters,
                    [data, request, options, deferredRejectAgain],
                    (response) => resolve(response)
                );
            };

            filterChain.fail(
                filters,
                [errorThrown, request, options, deferredResolve],
                () => reject(errorThrown) // All filters passed, reject the outer XHR
            );
        });
    });
};

