/**
 * Ajax.org Code Editor (ACE)
 *
 * @copyright 2010, Ajax.org Services B.V.
 * @license LGPLv3 <http://www.gnu.org/licenses/lgpl-3.0.txt>
 * @author Fabian Jakobs <fabian AT ajax DOT org>
 */

define(function(require, exports, module) {
    
var oop = require("pilot/oop");

var GenericMessage = function(values) {
	// TODO: take this business logic outside of this class
    this.seq = GenericMessage.$seq++;
	this.values = values;
	
	if ( this.type == undefined )
		throw new Error("this.type must be declared")
};

(function() {
	/*
    this.parse = function(msgString) {
        var json = JSON.parse(msgString);
        oop.mixin(this, json);
        return this;
    };
	*/
	
	this.__fromDict = function(obj) {
		if ( this.type != obj.type )
			throw new Error("invalid type");
		this.seq = obj.seq
		this.reqSeq = obj.reqSeq
		// TODO: validate obj.content		
		this.values = obj.content
	}	
		
	this.toDict = function() {
		// phase #1: check that keys are valid
        for (var i=0; i<this.values.length; i++) 
		{
			var name = this.values[i];
			
			if ( this.validKeys[name] == undefined )
				throw new Error("Invalid key " + name + " used for message of type " + this.type);
        }
		// phase #2: check that required fields are there
        for (var keyName in this.validKeys) 
		{
			if ( ( this.validKeys[keyName].required ) && ( this.values[keyName] == undefined ) )
				throw new Error("Key " + keyName + " is required");
        }
		// phase #3: construct object representation
		tmp = {
				"type": this.type,
				"seq": this.seq,
				"content": this.values
				}
				
		return tmp;
	}

    this.toJSON = function() {
        return JSON.stringify(this.toDict());
    };
	
	this.get = function(key,defaultValue) {
		return this.values[key] || defaultValue;
	}
	
	this.set = function(key,val) {
		this.values[key] = val;
	}
	
}).call(GenericMessage.prototype);

GenericMessage.$seq = 1;

GenericMessage.fromDict = function(req,formats)
{	
	if ( req.type == undefined )
		throw new Error("Invalid contnet");
		
	var format = null;
	for ( var i = 0 ; i < formats.length ; i++ )
	{
		var f = formats[i];
		if ( f.prototype.type == req.type )
		{
			format = f;
			break;
		}
	}
	if ( format === null )
		throw new Error("Invalid type " + req.type);
	
	dupl = function() {}
	oop.inherits(dupl,format);
	obj = new dupl();
	obj.__fromDict(req);
	
	return obj;
}

GenericMessage.fromJSON = function(jsonContent,formats)
{
	return GenericMessage.fromDict(JSON.parse(jsonContent),formats)
}


return GenericMessage;
});
