/**
 * Ajax.org Code Editor (ACE)
 *
 * @copyright 2010, Ajax.org Services B.V.
 * @license LGPLv3 <http://www.gnu.org/licenses/lgpl-3.0.txt>
 * @author Fabian Jakobs <fabian AT ajax DOT org>
 */

define(function(require, exports, module) {
    
var oop = require("pilot/oop");
var GenericMessage = require("./GenericMessage");


var RequestFromDebuggerMessage = function(cmd,args){
	// call super constructor
    GenericMessage.call(this,{"cmd":cmd,"args":args,"mati":3});
};

oop.inherits(RequestFromDebuggerMessage, GenericMessage);

(function() {
	this.type = "request";
	this.validKeys = {
		"cmd":{
				"required":true,
				},
		"args":{
				"required":false,
				}			
	};
}).call(RequestFromDebuggerMessage.prototype);

var ResponseFromDebuggerMessage = function(cmd,args){
	// call super constructor
    GenericMessage.call(this,{"cmd":cmd,"args":args,"mati":3});
};

oop.inherits(ResponseFromDebuggerMessage, GenericMessage);

(function() {
	this.type = "cmdReturn";
	this.validKeys = {
		"cmd":{
				"required":true,
				},
		"res":{
				"required":false,
				}			
	};
}).call(ResponseFromDebuggerMessage.prototype);

var formats = [RequestFromDebuggerMessage,ResponseFromDebuggerMessage];
function debuggerMessageFromJSON(jsonContent)
{
	return GenericMessage.fromJSON(jsonContent,formats);
}
function debuggerMessageFromDict(dict)
{
	return GenericMessage.fromDict(dict,formats);
}

return {
		"RequestFromDebuggerMessage":RequestFromDebuggerMessage,
		"fromJSON":debuggerMessageFromJSON,
		"fromDict":debuggerMessageFromDict,
		};
});
