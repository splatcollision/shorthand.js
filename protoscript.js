// protoscript.js
/* 

Author: Kevin Haggerty - kevin@splatcollision.com

(c) 2013 Kevin Haggerty, Splat Collision Web Industries, LLC.
ProtoScript may be freely distributed under the MIT license.

*/

// (selector) should (action) on (interaction)

(function(root){
	


	var ProtoScript;
	ProtoScript = root.ProtoScript = {};

	ProtoScript.VERSION = '0.0.1';

	// DOM manipulation
	ProtoScript.$ = root.jQuery || root.Zepto || root.ender || root.$;

	// directives = single line commands parsed into {source: (selector), handler: (action), event: (interaction)}
	ProtoScript.directives = [];

	// PRINCIPLE - simple natural language syntax to describe interactive behaviors - build complex behaviors simply.
	ProtoScript.verb = ' should ';
	ProtoScript.preposition = ' on ';
	// ProtoScript.conjunctions = ['and', 'or']; // ???

	// find all <script> tags and parse their contents
	ProtoScript.init = function() {
		this.scripts = this.$('script[type="text/protoscript"]');
		// console.log('protoscript init:', this.scripts);
		this.$.each(this.scripts, function(i, script){
			// console.log(script.innerText.split('\n'));
			var lines = script.innerText.split('\n');
			lines = ProtoScript.$.map(lines, function(line, i) {
				line = line.trim();
				// line = line.replace(/^\s+/g, ""); // beginning whitespace
				// line = line.replace(/\s+$/g, ""); // ending whitespace
				// console.log(line + '.');
				if (line.length > 0) return line;
			});
			
			ProtoScript.directives = ProtoScript.directives.concat(lines);
			// console.log(ProtoScript.directives);
		});
		// now we have basic directives from each line in each script tag. Let's break them down.
		this.directives = this.$.map(this.directives, function(directive, j) {
			// parse individual directives according to our template.
			// fail out non-good ones here too
			var verbIdx = directive.indexOf(ProtoScript.verb);
			var prepIdx = directive.indexOf(ProtoScript.preposition);
			// console.log(directive, verbIdx, prepIdx);
			var selector = directive.substring(0, verbIdx).trim();
			var action = directive.substring(verbIdx, prepIdx).replace(ProtoScript.verb.trim(), "").trim();
			var interaction = directive.substring(prepIdx, directive.length).replace(ProtoScript.preposition.trim(), "").trim();
			// check DOM for presence of selector - main test for failure of the directive
			var target = ProtoScript.$(selector);
			if (target.length === 0) {
				console.warn('ProtoScript warning: No valid target found, a directive will be ignored: "' + directive + '"');
				return; // PRINCIPLE - be tolerant of garbage input.
			}
			return {full: directive, selector: selector, target: target, action: action, interaction: interaction}
		});
		// console.log(this.directives);
		return this;
	}

	// hook up some event handlers according to parsed directives.
	ProtoScript.observe = function() {
		this.$.each(this.directives, function(i, directive){
			console.log('observing:', i, directive);

			directive.target.on(directive.interaction, function(evt){
				console.log(directive.action);
				ProtoScript.callback(directive, ProtoScript.$(this));
			});

		});

		return this;
	}

	// needs a better name - 'action handler heh'
	ProtoScript.callback = function(directive, origin) {
		// console.log('callback source:', origin);

		// let's parse the directive.action - split by words?
		// check for 'and'...
		var actions = directive.action.split(' and ');
		// now perform all actions
		actions.forEach(function(action){
			var args = action.split(' ');
			// console.log('doing:', args);
			// args[0] is our action identifier, other parts of the action should be sent as arguments
			var action = args.shift();
			if (!ProtoScript.Actions[action]) {
				console.warn('ProtoScript warning: no Action found for "' + action + '"');
				return;
			}
			// unshift the origin of this callback so we can use 'self' keyword for actions
			args.unshift(origin);
			ProtoScript.Actions[action].apply(ProtoScript, args);
		});
		
		// first part of action

	}

	// turn 'self' or 'next p' into real selectors - return $ element
	ProtoScript.findTarget = function(target, extra) {
		var origin = this.$(extra[0]).eq(0);
		extra = Array.prototype.slice.call(extra, 0);
		console.log(target, 'target extra:', extra, typeof extra);
		// self should use origin which is the first item of extra arg. (because we unshift the directive.target)
		if (target === 'self') return origin;

		// check for 'next' or 'previous' keywords in the target
		if (target === 'next') {
			// find index of target in extra, selector to use for next is in the index + 1 position
			return origin.next(extra[extra.indexOf(target) + 1]);
		}

		if (target === 'previous') {
			return origin.prev(extra[extra.indexOf(target) + 1]);
		}

		return this.$(target); // default case
	}


	// namespace our Actions handlers - provide mechanism for extending via 'plugins' of sorts
	ProtoScript.Actions = {};

	// a default set of basic actions.
	ProtoScript.Actions.hide = function(origin, target) {
		// convert arguments to an array?
		target = this.findTarget(target, arguments); // handle 'next p' and 'self' issues here.
		target.hide();
	}

	ProtoScript.Actions.show = function(origin, target) {
		target = this.findTarget(target, arguments); 
		target.show();
	}

	ProtoScript.Actions.toggle = function(origin, target) {
		target = this.findTarget(target, arguments);
		target.toggle();
	}

	ProtoScript.Actions.toggleclass = function(origin, className, target) {
		target = this.findTarget(target, arguments); 
		target.toggleClass(className.replace(/'/g, ""));
	}

	// page navigation
	ProtoScript.Actions.goto = function(origin, destination) {
		root.location = destination.replace(/'/g, ""); // simple version
	}

	// load 'path' into (selector)
	ProtoScript.Actions.load = function(origin, url, insertion, target) {
		target = this.findTarget(target, arguments);
		// insertion is only 'into' and we don't do anything yet with it - but could use before or after perhaps
		console.log('load action:', target, url, insertion);
		url = url.replace(/'/g, "");
		target.load(url);
	}

})(this);

// automatically kick things off.
this.ProtoScript.init().observe();