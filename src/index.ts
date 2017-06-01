import middlewareChain from "./MiddlewareChain";

declare global {
    interface Window {
        addMiddleware(middleware: FetchMiddleware): void;
    }
}

export interface FetchMiddleware {
    /**
     * Executed before the request is sent, you may add headers or change the options any way you want
     */
    before?(settings: RequestInfo, options?: RequestInit): void;

    /**
     * Executed when the request was successful, you can implement any logic here, even asynchronous.
     *
     * You can call reject(String reason) if you decide the request should not pass.
     */
    then?(
        response: Response, 
        settings: RequestInfo, 
        options: RequestInit, 
        reject: (reason: any) => void, 
        next: (newResponse?: Response) => void
    ): void;

    /**
     * Executed when the request was successful, you can implement any logic here, even asynchronous.
     *
     * You can call resolve(Object data) if you decide the request should pass.
     */
    fail?(
        reason: any, 
        settings: RequestInfo, 
        options: RequestInit, 
        resolve: (response: Response) => void, 
        next: Function
    ): void;
}

var middlewares: FetchMiddleware[] = [];

/**
 * Register a new Middleware
 *
 * @param middleware
 */
window.addMiddleware = function(middleware: FetchMiddleware) {
    middlewares.push(middleware);
}

const bounceError = "Bouncing between rejected and resolved, stopping loop";

var originalFetch = window.fetch;
window.fetch = function(request: RequestInfo, options?: RequestInit): Promise<Response> {

    return new Promise((resolve, reject) => {
        // Before middlewares
        middlewareChain.before(middlewares, request, options);

        // Make the actual call
        var innerXHR = originalFetch(request, options);

        innerXHR.then((data: Response) => {
            // This is called when the request is bouncing between rejected and resolved
            const deferredResolveAgain = function () {
                reject(bounceError);
                throw new Error(bounceError);
            };

            // If a middleware decides to reject the request, this method is called
            const deferredReject = function (errorThrown: any) {
                middlewareChain.fail(
                    middlewares, 
                    [errorThrown, request, options, deferredResolveAgain], 
                    () => reject(errorThrown)
                );
            };

            middlewareChain.done(
                middlewares,
                [data, request, options, deferredReject], 
                (response) => resolve(response) // All middlewares passed, resolve the outer XHR
            );
        });

        innerXHR.catch((errorThrown: any) => {
            // This is called when the request is bouncing between rejected and resolved
            const deferredRejectAgain = function () {
                reject(errorThrown);
                throw new Error(bounceError);
            };

            // If a middleware decides to resolve the request, this method is called
            var deferredResolve = function (data: Response) {
                middlewareChain.done(
                    middlewares,
                    [data, request, options, deferredRejectAgain],
                    (response) => resolve(response)
                );
            };

            middlewareChain.fail(
                middlewares, 
                [errorThrown, request ,options, deferredResolve], 
                () => reject(errorThrown) // All middlewares passed, reject the outer XHR
            );
        });
    });
};

