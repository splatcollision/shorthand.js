// shorthand.js

/* 

Author: Kevin Haggerty - kevin@splatcollision.com

(c) 2013 Kevin Haggerty, Splat Collision Web Industries, LLC.
Shorthand may be freely distributed under the MIT license.

See 'README.md' for more details.

*/

// optional AMD https://github.com/umdjs/umd/blob/master/amdWeb.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        root.ShortHand = factory(root, root.jQuery);
    }
}(this, function (root, $) {
 	"use strict";

	var ShortHand = {};

	ShortHand.VERSION = '0.1.0';

	// Find a compatible DOM manipulation library.
	ShortHand.$ = $; // root.jQuery || root.Zepto || root.$;


	// mini resource loaders
	function loadScript(src, func) {
		var scripttag = document.createElement('script');
		scripttag.setAttribute('type', 'text/javascript'); 
		scripttag.setAttribute('src', src);
		if (func) scripttag.onload = func;
		document.body.appendChild(scripttag);
	}

	function loadStyle(src, func) {
		var stylesheet = document.createElement('link');
		stylesheet.setAttribute('rel', 'stylesheet'); 
		stylesheet.setAttribute('href', src);
		if (func) stylesheet.onload = func;
		document.head.appendChild(stylesheet);
	}

	function loadModuleIncludes(includes) {
		console.log('loadModuleIncludes:', includes.css, includes.js);
		// includes.css [] loadStyle
		if (includes.css) {
			for (var i in includes.css) {
				loadStyle(includes.css[i]);
			}
		}
		// includes.js [] loadScript
		if (includes.js) {
			for (var j in includes.js) {
				loadScript(includes.js[j]);
			}
		}
	}

	function loadModuleActions(actions) {
		// assocaite each key with a this.Actions handler
		for (var actionKey in actions) {
			// console.log('actionKey:', actionKey, actions[actionKey]);
			if (typeof actions[actionKey] === 'function') {
				ShortHand.Actions[actionKey] = actions[actionKey];
			}
		}
	}
	// bootstrap a dom manipulation library if we can't find one (jQuery default)
	if (!ShortHand.$) {
		console.warn('ShortHand warning: no DOM library found, attempting to add jQuery.');
		loadScript('//cdnjs.cloudflare.com/ajax/libs/jquery/2.0.1/jquery.min.js', function(){
			console.log('jQuery loaded, good to go.');
			ShortHand.init();
		});
	}

	// directives = single line commands parsed into {source: (selector), handler: (action), event: (interaction)}
	ShortHand.directives = [];

	// PRINCIPLE - simple natural language syntax to describe interactive behaviors - build complex behaviors simply.
	ShortHand.verb = ' should ';
	ShortHand.preposition = ' on ';
	ShortHand.helperverb = ' be ';
	ShortHand.optionword = ' with ';
	// TODO also support better this grammar: #selector should be actiony with options

	// TODO - provide aliases for event names?
	// ShortHand.eventMap = {};

	ShortHand.init = function() {
		// try to pick up the global DOM library again
		this.$ = root.jQuery || root.Zepto || root.$;
		console.log('do we have jquery:', this.$);
		if (!this.$) {
			// we've got to fail here
			return;
		}
		// TODO check query params on our script element for additional modules
		// animate module should load animate.css from cdn and enable > animate "slideOutUp" #target on click
		this.initModules();
		// call parseScripts once DOM load is complete.
		this.$(function(){
		  ShortHand.parseScripts();
		})
	}


	ShortHand.initModules = function() {
		console.log('modules check:', this.Modules);
		for (var mod in this.Modules) {
			console.log('module:', this.Modules[mod]);
			var module = this.Modules[mod];
			var actions = module.actions;
			var includes = module.includes;
			if (includes) loadModuleIncludes(includes);
			if (actions) loadModuleActions(actions);
		}
	}

	// find all <script> tags and parse their contents
	ShortHand.parseScripts = function() {
		// find our script blocks
		this.scripts = this.$('script[type="text/ShortHand"]');
		// console.log('ShortHand parseScripts:', this.scripts);
		// collect directives
		var directivesRaw = [];
		// look at each script block
		this.$.each(this.scripts, function(i, script){
			// get each line of ShortHand
			var lines = script.innerText.split('\n');
			// cleanup whitespace - trim each line and ignore empty lines
			lines = ShortHand.$.map(lines, function(line, i) {
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
			var verbIdx = directive.indexOf(ShortHand.verb);
			var prepIdx = directive.indexOf(ShortHand.preposition);
			var optionsIdx = directive.indexOf(ShortHand.optionword);
			// find the main selector
			var selector = directive.substring(0, verbIdx).trim(), action, interaction, withOptions, target;

			if (selector.indexOf('//') > -1) return; // support js style comments

			// if no prepIdx then there is no 'on' action -- 
			if (prepIdx === -1) {
				// alternate 'be' format of #selector should be draggable
				action = directive.substring(verbIdx, directive.length).replace(ShortHand.verb.trim(), "").trim();
				
				if (optionsIdx > -1) {
					action = directive.substring(verbIdx, optionsIdx).replace(ShortHand.verb.trim(), "").trim();
					withOptions = directive.substring(optionsIdx, directive.length).replace(ShortHand.optionword.trim(), "").trim();	
				}
				
			} else {
				// find the action & interaction
				action = directive.substring(verbIdx, prepIdx).replace(ShortHand.verb.trim(), "").trim();	
				interaction = directive.substring(prepIdx, directive.length).replace(ShortHand.preposition.trim(), "").trim();
			}
			
			// find the interaction event - BUGGY if a target has 'on' like 'container'
			
			// check the DOM for the presence of selector - main test for failure of the directive
			// PRINCIPLE - be tolerant of garbage input.
			console.log("directive:", directive, verbIdx, prepIdx);
			console.log("selector:", selector);
			console.log("should:", action);
			console.log("interaction:", interaction);
			console.log("options:", withOptions);
			target = ShortHand.$(selector);

			if (target.length === 0) {
				console.warn('ShortHand warning: No valid target found, a directive will be ignored: "' + directive + '"');
				return; 
			}
			// return an object containing the elements of a ShortHand directive.
			return {full: directive, selector: selector, target: target, action: action, interaction: interaction, withOptions: withOptions}
		});
		console.log('directives:', this.directives);
		// call the 'observe' method and return this object.
		return this.observe();
	}

	// 'observe()' - hook up event handlers according to parsed directives.
	ShortHand.observe = function() {
		this.$.each(this.directives, function(i, directive){
			directive.target.addClass('shorthand-interactive'); // maybe usable in the future...
			// check for custom 'load' event
			if (directive.interaction === 'load') {
				// if it's a load event, we can just call the action right away.
				ShortHand.callback(directive, directive.target);
			} else if (directive.action.indexOf('be') === 0) {
				console.log('be type interaction:', directive.action );
				directive.action = directive.action.replace('be', '').trim();
				// if ShortHand.Actions[directive.action]
				console.log('be type interaction:', directive.action, ShortHand.Actions[directive.action] );
				// if (ShortHand.Actions[directive.action]) {
					// directly call the action
					ShortHand.callback(directive, ShortHand.$(directive.selector));
					// ShortHand.Actions[directive.action].apply(ShortHand, [ShortHand.$(directive.selector), directive]);
				// }
			} else {
				// add a pointer cursor so we know it's interactive!
				directive.target.css('cursor', 'pointer');

				// set up the event observer normally.
				directive.target.on(directive.interaction, function(evt){
					// callback gets the main directive object and the element which is source of the event (source selector)
					ShortHand.callback(directive, ShortHand.$(this));
				});	
			}
			

		});
		// return this for chaining.
		return this;
	}

	// 'callback()' (needs a better name?) - routes user interactions to ShortHand.Actions
	ShortHand.callback = function(directive, origin) {
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
			if (!ShortHand.Actions[action]) {
				console.warn('ShortHand warning: no Action found for "' + action + '"');
				return;
			}
			// unshift the origin of this callback so we can use 'self' keyword for actions.
			
			// args.unshift(origin);
			// changed to contain both origin and source directive - useful for complex module handlers - referred to as 'args' in the callback
			args.unshift({origin: origin, directive: directive});

			// if target is always the last item in args maybe we can findTarget before calling the actions
			// makes extending actions cleaner...

			// now call the Action function, applying the args array as individual arguments.
			ShortHand.Actions[action].apply(ShortHand, args);
		});
	}

	// 'findTarget()' turn 'self' or 'next p' into real selectors - return $ element
	ShortHand.findTarget = function(target, extra) {
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

	// module defs
	ShortHand.Modules = {};

	ShortHand.Modules.animate = {
		includes: {
			css: ["//cdnjs.cloudflare.com/ajax/libs/animate.css/3.2.0/animate.min.css"]
		},
		actions: {
			"animate": function(args, animationName, target) {
				console.log('testing animate:', args, animationName, target);
				target = this.findTarget(target, args.origin);
				var animClasses = 'animated ' + animationName.replace(/'/g, "");
				// addClass animate + other thing
				// oh repeatable heyyyy
				target.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(evt){
					// $(this);
					ShortHand.$(evt.target).removeClass(animClasses);
				});
				// do the add
				target.show().addClass(animClasses);
				
			}
			// might try to do variants which would set hidden before/after state of target
		}
	}
	ShortHand.Modules.interactjs = {
		includes: {
			js: ["//cdnjs.cloudflare.com/ajax/libs/interact.js/1.2.2/interact.min.js"]
		},
		// draggable "be draggable"
		actions: {
			// first argument changed to contain both origin and source directive object via .origin and .directive
			"draggable": function(args, target) {
				console.log('testing drag:', args, args.directive);
				// target = this.findTarget(target, arguments);
				if (!interact) return console.warn('no interact.js');
				interact(args.directive.selector).draggable({
					// call this function on every dragmove event
					    onmove: function (event) {
					      var target = event.target,
					          // keep the dragged position in the data-x/data-y attributes
					          x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
					          y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

					      // translate the element
					      target.style.webkitTransform =
					      target.style.transform =
					        'translate(' + x + 'px, ' + y + 'px)';

					      // update the posiion attributes
					      target.setAttribute('data-x', x);
					      target.setAttribute('data-y', y);
					    }
				});
				
			},
			"resizeable": function(args, target) {
				console.log('testing resize', args, args.directive);
				if (!interact) return console.warn('no interact.js');
				interact(args.directive.selector).resizable(true)
				  .on('resizemove', function (event) {
				  	console.log('resizemove:', event);
				    var target = event.target;

				    // add the change in coords to the previous width of the target element
				    var newWidth  = parseFloat(target.style.width || target.clientWidth) + event.dx,
				        newHeight = parseFloat(target.style.height || target.clientHeight) + event.dy;

				    // update the element's style
				    target.style.width  = newWidth + 'px';
				    target.style.height = newHeight + 'px';

				    // target.textContent = newWidth + '×' + newHeight;
				  });
			}
		}
		// drop zone "should be draggable with drop zone #target"
		// snappable "should be draggable with snapping"
		// resizing: "should be resizeable" hmmm
	}

	// namespace our Actions handlers - TODO provide mechanism for extending via 'plugins' of sorts
	ShortHand.Actions = {};

	// a default set of basic actions.
	ShortHand.Actions.hide = function(origin, target) {
		// convert arguments to an array?
		target = this.findTarget(target, origin.origin); // handle 'next p' and 'self' issues here.
		target.hide();
	}

	ShortHand.Actions.show = function(origin, target) {
		target = this.findTarget(target, origin.origin); 
		target.show();
	}

	ShortHand.Actions.toggle = function(origin, target) {
		target = this.findTarget(target, origin.origin);
		target.toggle();
	}

	ShortHand.Actions.addclass = function(origin, className, target) {
		target = this.findTarget(target, origin.origin); 
		console.log('addclass:', target, className);
		target.addClass(className.replace(/'/g, ""));
	}

	ShortHand.Actions.removeclass = function(origin, className, target) {
		target = this.findTarget(target, origin.origin); 
		console.log('removeclass:', target, className);
		target.removeClass(className.replace(/'/g, ""));
	}

	ShortHand.Actions.toggleclass = function(origin, className, target) {
		target = this.findTarget(target, origin.origin); 
		target.toggleClass(className.replace(/'/g, ""));
	}

	// page navigation
	ShortHand.Actions.goto = function(origin, destination) {
		root.location = destination.replace(/'/g, ""); // simple version
	}

	// load 'path' into (selector)
	ShortHand.Actions.load = function(origin, url, insertion, target) {
		target = this.findTarget(target, origin.origin);
		// insertion is only 'into' and we don't do anything yet with it - but could use before or after perhaps
		// console.log('load action:', target, url, insertion);
		url = url.replace(/'/g, "");
		target.load(url); // TODO - ensure any matching selectors in the new content get hooked up - maybe a global 'unobserve' 'observe' refresh?
	}


	// todo - animations and transitions
    return ShortHand;
}));


// // For now, automatically kick things off.
// this.ShortHand.init();

// // sample extension of Actions to add custom one.
// window.ShortHand.Actions.enlarge = function(origin, target) {
// 	target = this.findTarget(target, arguments);
// 	// do whatever you like here with the target DOM element.
// 	target.css("font-size", "10em");
// }