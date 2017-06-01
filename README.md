# Fetch filter

[![Travis](https://img.shields.io/travis/swissquote/fetch-filter.svg?style=flat-square)](https://travis-ci.org/swissquote/fetch-filter)
[![npm (scoped)](https://img.shields.io/npm/v/@swissquote/fetch-filter.svg?style=flat-square)](https://www.npmjs.com/package/@swissquote/fetch-filter)


Fetch filter is a utility library that replaces the original `fetch` with itself to allow manipulations on the response before the original requester gets the response.
 
This allows to implement things like password confirmations without needing to modify the original code in any way.

> Fetch filter is a successor to [jquery-xhrfilter](https://www.npmjs.com/package/jquery-xhrfilter)
> But because of more recent APIs, I needed to also provide a version that works with fetch.
>
> Both are very similar, except in how rejections are handled, in `$.ajax`: 
> a 400 or 500 error code results in a rejected promise, but in `fetch` only a network error
> ends in a rejected promise.

## API

The API surface consists of one method and one interface.
The `FetchFilter` interface has three optional methods `before`, `then` and `fail` that are called respectively before fetch, when the request succeeded and when the request failed.

Implement the functions you need and leave the others unset.

Be careful with the  `then` and `fail` as you MUST call `next()` when you're done with your filter or your requests will never end.

Once you've created your filter, call `addFetchFilter` with it and it is added in the chain of filters.

```typescript
interface FetchFilter {
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
```

```typescript
addFetchFilter(filter: FetchFilter): void;
```

## Examples

In this example, if a request fails with a 403 error and {error: "no_auth_token"} as content,
we will request an authentication token to the user and re-send the request to the server with this token.



```typescript
addFetchFilter({
    then: function(response, settings, options, reject, next) {
        // Only handle 403's
        if (response.status != "403") {
            next();
            return;
        }
        
        response.json().then(function(content) {
            // Only handle "no_auth_token" errors
            // Leave the rest to other filters or
            // the original handler
            if (!content.error || content.error != 'no_auth_token') {
                next();
                return;
            }

            // At this stage, you know your request failed with a "no_auth_token" error
            // You can decide to show a popup that requests a password from the user, do
            // a request to a specific server, or simply retry the initial request with
            // new parameters.

            // `modalValidate()` is a promise that will show a popup to the user 
            // asking if he wants to accept this request or not.
            modalValidate().then(function (authToken) {
                // Deep clone the options and add a header
                // We clone because we don't want to modify the original request
                var newOptions = options && JSON.parse(JSON.stringify(options)) || {};
                newOptions.headers = newOptions.headers || {};
                newOptions.headers['X-Auth-token'] = authToken;
        
                // Now we make a new request with authorization in place
                fetch(settings, newOptions).then(function(response) {

                    // If this request succeeds, we'll send the new
                    // response to the next handler
                    next(response);

                }).catch(reject); // The new request failed, we'll just fail the full request

            }).catch(function () {
                // If the validation is incorrect, go back to the normal cycle of things 
                // and the original requester will see the error
                next();
            });

        }).catch(next) // If the json can't be parsed it's probably not for us, continue with the rest
    }
});
```
