// protoscript.js

/* 

Author: Kevin Haggerty - kevin@splatcollision.com

(c) 2013 Kevin Haggerty, Splat Collision Web Industries, LLC.
ProtoScript may be freely distributed under the MIT license.

See 'README.md' for more details.

*/





(function(root){
	
	var ProtoScript;
	ProtoScript = root.ProtoScript = {};

	ProtoScript.VERSION = '0.0.1';

	// Find a compatible DOM manipulation library.
	ProtoScript.$ = root.jQuery || root.Zepto || root.$;

	// bootstrap a dom manipulation library if we can't find one (jQuery default)
	if (!ProtoScript.$) {
		console.warn('ProtoScript warning: no DOM library found, attempting to add jQuery.');
		var domLib = document.createElement('script');
		domLib.setAttribute('type', 'text/javascript'); 
		domLib.setAttribute('src', '//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.1/jquery.min.js');
		domLib.onload = function(evt) {
			// console.log('jQuery loaded, good to go.');
			ProtoScript.init();
		}
		document.body.appendChild(domLib);
	}

	// directives = single line commands parsed into {source: (selector), handler: (action), event: (interaction)}
	ProtoScript.directives = [];

	// PRINCIPLE - simple natural language syntax to describe interactive behaviors - build complex behaviors simply.
	ProtoScript.verb = ' should ';
	ProtoScript.preposition = ' on ';

	// TODO - provide aliases for event names?
	// ProtoScript.eventMap = {};

	ProtoScript.init = function() {
		// try to pick up the global DOM library again
		this.$ = root.jQuery || root.Zepto || root.$;
		if (!this.$) {
			// we've got to fail here
			return;
		}
		// call parseScripts once DOM load is complete.
		this.$(function(){
		  ProtoScript.parseScripts();
		})
	}

	// find all <script> tags and parse their contents
	ProtoScript.parseScripts = function() {
		// find our script blocks
		this.scripts = this.$('script[type="text/protoscript"]');
		// console.log('protoscript parseScripts:', this.scripts);
		// collect directives
		var directivesRaw = [];
		// look at each script block
		this.$.each(this.scripts, function(i, script){
			// get each line of protoscript
			var lines = script.innerText.split('\n');
			// cleanup whitespace - trim each line and ignore empty lines
			lines = ProtoScript.$.map(lines, function(line, i) {
				line = line.trim();
				if (line.length === 0) return;
				return line;
			});
			// collect each script block's lines into a single array
			directivesRaw = directivesRaw.concat(lines);
		});
		// now we have basic directives from each line in each script tag. 
		// Let's break them down.
		this.directives = this.$.map(directivesRaw, function(directive, j) {
			// parse individual directives according to our template.
			// find indexes of main grammar elements
			var verbIdx = directive.indexOf(ProtoScript.verb);
			var prepIdx = directive.indexOf(ProtoScript.preposition);
			// find the main selector
			var selector = directive.substring(0, verbIdx).trim();
			// find the action
			var action = directive.substring(verbIdx, prepIdx).replace(ProtoScript.verb.trim(), "").trim();
			// find the interaction event
			var interaction = directive.substring(prepIdx, directive.length).replace(ProtoScript.preposition.trim(), "").trim();
			// check the DOM for the presence of selector - main test for failure of the directive
			// PRINCIPLE - be tolerant of garbage input.
			var target = ProtoScript.$(selector);
			if (target.length === 0) {
				console.warn('ProtoScript warning: No valid target found, a directive will be ignored: "' + directive + '"');
				return; 
			}
			// return an object containing the elements of a protoscript directive.
			return {full: directive, selector: selector, target: target, action: action, interaction: interaction}
		});
		// call the 'observe' method and return this object.
		return this.observe();
	}

	// 'observe()' - hook up event handlers according to parsed directives.
	ProtoScript.observe = function() {
		this.$.each(this.directives, function(i, directive){
			// add a pointer cursor so we know it's interactive!
			directive.target.css('cursor', 'pointer');
			// check for custom 'load' event
			if (directive.interaction === 'load') {
				// if it's a load event, we can just call the action right away.
				ProtoScript.callback(directive, directive.target);
			} else {
				// set up the event observer normally.
				directive.target.on(directive.interaction, function(evt){
					// callback gets the main directive object and the element which is source of the event (source selector)
					ProtoScript.callback(directive, ProtoScript.$(this));
				});	
			}
			

		});
		// return this for chaining.
		return this;
	}

	// 'callback()' (needs a better name?) - routes user interactions to ProtoScript.Actions
	ProtoScript.callback = function(directive, origin) {
		// console.log('callback source:', origin);
		// we parse directive.action on demand here.
		// split multiple actions on the 'and' keyword.
		var actions = directive.action.split(' and ');
		// now perform all the actions
		actions.forEach(function(action){
			// separate actions into individual arguments
			var args = action.split(' ');
			// console.log('doing:', args);
			// args[0] is our action identifier, the other parts of the action should be sent as arguments to the Action functions.
			var action = args.shift();
			// check to be sure we have a matching action - provide some feedback so mistakes can be corrected.
			if (!ProtoScript.Actions[action]) {
				console.warn('ProtoScript warning: no Action found for "' + action + '"');
				return;
			}
			// unshift the origin of this callback so we can use 'self' keyword for actions.
			args.unshift(origin);

			// if target is always the last item in args maybe we can findTarget before calling the actions
			// makes extending actions cleaner...

			// now call the Action function, applying the args array as individual arguments.
			ProtoScript.Actions[action].apply(ProtoScript, args);
		});
	}

	// 'findTarget()' turn 'self' or 'next p' into real selectors - return $ element
	ProtoScript.findTarget = function(target, extra) {
		var origin = this.$(extra[0]).eq(0);
		extra = Array.prototype.slice.call(extra, 0);
		var targetSelectorIdx = extra.indexOf(target) + 1;
		var targetSelector;
		if (extra.length-1 >= targetSelectorIdx) targetSelector = extra[targetSelectorIdx];
		// console.log(target, 'target extra:', extra, typeof extra);
		// self should use origin which is the first item of extra arg. (because we unshift the directive.target)
		if ((target === 'self') || (target === 'itself')) return origin;

		// check for 'next' or 'previous' keywords in the target
		if (target === 'next') {
			// find index of target in extra, selector to use for next is in the index + 1 position
			// TODO support plain 'next' without another selector
			return origin.next(targetSelector);
		}

		if (target === 'previous') {
			return origin.prev(targetSelector);
		}
		// check for extended selectors which might be space separated?
		return this.$(target); // default case
	}


	// namespace our Actions handlers - TODO provide mechanism for extending via 'plugins' of sorts
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

	ProtoScript.Actions.addclass = function(origin, className, target) {
		target = this.findTarget(target, arguments); 
		console.log('addclass:', target, className);
		target.addClass(className.replace(/'/g, ""));
	}

	ProtoScript.Actions.removeclass = function(origin, className, target) {
		target = this.findTarget(target, arguments); 
		console.log('removeclass:', target, className);
		target.removeClass(className.replace(/'/g, ""));
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
		// console.log('load action:', target, url, insertion);
		url = url.replace(/'/g, "");
		target.load(url); // TODO - ensure any matching selectors in the new content get hooked up - maybe a global 'unobserve' 'observe' refresh?
	}


	// todo - animations and transitions



})(this);

// For now, automatically kick things off.
this.ProtoScript.init();

// sample extension of Actions to add custom one.
window.ProtoScript.Actions.enlarge = function(origin, target) {
	target = this.findTarget(target, arguments);
	// do whatever you like here with the target DOM element.
	target.css("font-size", "10em");
}