/**
 * Ajax.org Code Editor (ACE)
 *
 * @copyright 2010, Ajax.org Services B.V.
 * @license LGPLv3 <http://www.gnu.org/licenses/lgpl-3.0.txt>
 * @author Fabian Jakobs <fabian AT ajax DOT org>
 */

define(function(require, exports, module) {
    
var oop = require("pilot/oop");
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var PythonDebuggerMessage = require("./PythonDebuggerMessage")

var PythonDebugger = function(tabId, v8service) {
    this.tabId = tabId;
    this.$running = true;
    this.$service = v8service;

    var pending = this.$pending = [];

    var self = this;
    this.$service.addEventListener("debugger_command_" + tabId, function(e) {
        var response = PythonDebuggerMessage.fromDict(e.data);
		
		// TODO: validate the message???

		// TODO: move this to a different location. This is not Python Debugger specific
        var requestSeq = response.reqSeq;
		
        if (self.$pending[requestSeq]) {
            self.$pending[requestSeq](
			  // use is-instance-of instead of inspecting the type
              response.type == "cmdReturn" ? response.get("res") || null : null,
			  // what is this refs?
              null,
			  !(response.type == "cmdReturn") && ( response.get("failureDescription") ) || null
            );
            delete self.$pending[requestSeq];
        }
        else if (response.event) {
            if (response.event == "break") {
                var event = JSON.stringify(response.body);
                if (this.lastBreak != event) {
                    this.lastBreak = event;
                    self._dispatchEvent(response.event, {data: response.body});
                }
            }
            else
                self._dispatchEvent(response.event, {data: response.body});
        }

        self.$updateRunning(response);
     });
};

(function() {

    oop.implement(this, EventEmitter);

    this.$seq = 0;

    this.$updateRunning = function(response) {

        // workaround for V8 bug
        // http://code.google.com/p/v8/issues/detail?id=724
        if (response.event == "scriptCollected")
            return;

        var running = true;
        if (response.type == "response") {
            var running = response.running;
        } else if (response.type == "event") {
            if (response.event == "break" || response.event == "exception") {
                running = false;
            }
        }

        if (running !== this.$running) {
            this.$running = running;
            this._dispatchEvent("changeRunning", {data: running});
        }
    };

    this.isRunning = function() {
        return this.$running;
    };

    this.continueScript = function(stepaction, stepcount, callback) {
        var msg = new V8Message("request");
        msg.command = "continue";
        if (stepaction) {
            msg.arguments = {
                stepcount: stepcount || 1,
                stepaction: stepaction
            };
        }
        this.$send(msg, callback);
    };

    this.lookup = function(handles, includeSource, callback) {
        var msg = new V8Message("request");
        msg.command = "lookup";
        msg.arguments = {
            inlineRefs: false,
            handles: handles
        };
        if (includeSource)
            msg.arguments.includesSource = includeSource;

        this.$send(msg, callback);
    };

    this.backtrace = function(fromFrame, toFrame, bottom, inlineRefs, callback) {
        var msg = new V8Message("request");
        msg.command = "backtrace";
        msg.arguments = {
                inlineRefs: !!inlineRefs
        };
        if (fromFrame)
            msg.arguments.fromFrame = fromFrame;

        if (toFrame)
            msg.arguments.toFrame = toFrame;

        if (typeof(bottom) == "boolean")
            msg.arguments.bottom = bottom;

        this.$send(msg, callback);
    };

    this.scope = function(number, frameNumber, inlineRefs, callback) {
        var msg = new V8Message("request");
        msg.command = "scope";
        msg.arguments = {
            number: number,
            inlineRefs: !!inlineRefs
        };

        if (typeof frameNumber == "number")
            msg.arguments.frameNumber = frameNumber;

        this.$send(msg, callback);
    };

    this.version = function(callback) {
        var msg = new V8Message("request");
        msg.command = "version";
        this.$send(msg, callback);
    };

    this.scripts = function(types, ids, includeSource, callback) {
		var args = {};
		args["includeSource"] = includeSource
		if ( ( ids != undefined ) && ( ids != null ) )
			args["ids"] = ids
		else
			args["fromStack"] = true
	
		var msg = new PythonDebuggerMessage.RequestFromDebuggerMessage("getScriptsMetadata",args);
        this.$send(msg, function(scripts, refs, err) {
            callback(scripts || [], refs, err);
        });
    };

    this.evaluate = function(expression, frame, global, disableBreak, callback) {
        var msg = new V8Message("request");
        msg.command = "evaluate";
        msg.arguments = {
            expression : expression
        };
        if (frame)
            msg.arguments.frame = frame;
        if (global)
            msg.arguments.global = global;
        if (disableBreak)
            msg.arguments.disable_break = disableBreak;
        this.$send(msg, callback);
    };

    this.setbreakpoint = function(type, target, line, column, enabled, condition, ignoreCount, callback) {
        var msg = new V8Message("request");
        msg.command = "setbreakpoint";
        msg.arguments = {
            type: type,
            target: target,
            line: line,
            enabled: enabled === undefined ? enabled : true
        };

        if (column)
            msg.column = column;

        if (condition)
            msg.condition = condition;

        if (ignoreCount)
            msg.ignoreCount = ignoreCount;

        this.$send(msg, callback);
    };

    this.changebreakpoint = function(breakpoint, enabled, condition, ignoreCount, callback) {
        var msg = new V8Message("request");
        msg.command = "changebreakpoint";
        msg.arguments = {
            enabled: enabled !== true ? false : true,
            breakpoint: breakpoint
        };

        if (condition)
            msg.condition = condition;

        if (ignoreCount)
            msg.ignoreCount = ignoreCount;

        this.$send(msg, callback);
    };

    this.clearbreakpoint = function(breakpoint, callback) {
        var msg = new V8Message("request");
        msg.command = "clearbreakpoint";
        msg.arguments = {
            breakpoint: breakpoint
        };
        this.$send(msg, callback);
    };

    this.listbreakpoints = function(callback) {
		// for now we simply call the callback with no breakpoints.
		callback(null);
		/*
        var msg = new V8Message("request");
        msg.command = "listbreakpoints";
        this.$send(msg, callback);
		*/
    };

    this.suspend = function(callback) {
        var msg = new V8Message("request");
        msg.command = "suspend";
        this.$send(msg, callback);
    };
    
    this.changelive = function(scriptId, newSource, previewOnly, callback) {
        var msg = new V8Message("request");
        msg.command = "changelive";
        msg.arguments = {
            script_id: scriptId,
            new_source: newSource,
            preview_only: !!previewOnly
        };

        this.$send(msg, callback);
    };

    this.$send = function(msg, callback) {
		// TODO: move out of this file
        if (callback)
		{
            this.$pending[msg.seq] = callback;
		}
            
        this.$service.debuggerCommand(this.tabId, msg);
    };

}).call(PythonDebugger.prototype);

PythonDebugger.NATIVE_SCRIPTS = 1;
PythonDebugger.EXTENSION_SCRIPTS = 2;
PythonDebugger.NORMAL_SCRIPTS = 4;

return PythonDebugger;

});