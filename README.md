# XHR Filters

XHR Filter is a utility library that replaces the original `$.ajax` with itself to allow manipulations on the response before the original requester gets the response.
 
This allows to implement things like password confirmations without needing to modify the original code in any way.

## Example usage

```javascript
$.ajaxRegisterFilter({
   fail: function (jqXHR, error, options, resolve, next) {
	   // Only handle 403's
	   if (jqXHR.status != "403") {
		   next();
		   return;
	   }

	   // Only handle "no_auth_token" errors
	   var content = JSON.parse(jqXHR.responseText);
	   if (!content.error || content.error != 'no_auth_token') {
		   next();
		   return;
	   }

	   modalValidate().then(function () {
		   // Clone the options, do not mutate the original object
		   options = $.extend({}, options, {headers: {'Auth-token': 'It\'s better with an auth token'}});

		   $.ajax(options).then(function (data, textStatus, innerXHR) {
			   resolve(data, innerXHR);
		   }, function () {
			   // Carry on if the request still failed ...
			   next();
		   });

	   }).fail(function () {
		   // If the validation is incorrect, go back to the normal cycle of things
		   next();
	   });
   }
});

```

## The API

## `$.ajaxRegisterFilter(AjaxFilter filter)`

There is the method to register a new filter

## `AjaxFilter`

This can be implemented as a class or as a plain object.
All methods are optional, but obviously it is recommended to put at least one ;-)

### `function before(AjaxOptions settings) {}`

Executed before the request is sent, you may add headers or change the options any way you want

### `function done(jqXHR jqXHR, Object data, AjaxOptions settings, Function reject, Function next) {}`

Executed when the request was successful, you can implement any logic here, even asynchronous.

You can call `reject(String reason)` if you decide the request should not pass.
 

### `function fail(jqXHR jqXHR, String thrownError, AjaxOptions settings, Function resolve, Function next) {}`

Executed when the request was successful, you can implement any logic here, even asynchronous.

You can call `resolve(Object data, jqXHR jqXHR)` if you decide the request should pass.


> __Important for `done` and `fail`__
>
> You __must__ call `next()` when you're done with your logic or else the code will not know when to execute the rest of the chain of filters.
>
> The only time you can omit to call it is when you call `resolve` inside `fail` or `reject` inside `done`
