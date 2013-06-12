# Shorthand.js

#### A lightweight, natural language syntax for describing interactive behaviors for the web.

Shorthand is intended for quickly prototyping behaviors in HTML mockups. The idea is to quickly test out user interactions without investing tons of time in custom JavaScript programming. Shorthand should get you 80% of the way to a functional 'web thang', without the headaches of jQuery spaghetti code.

Shorthand statements all follow a simple basic syntax:

    (selector) should (do an action) on (user interaction)

## Setup

Setup is easy - just include the base Shorthand.js file anywhere in your page, and then add custom &lt;SCRIPT&gt; blocks for your Shorthand statements

Shorthand requires a jQuery-compatable DOM manipulation to be loaded in the page for it to work. You can include your preferred library (Zepto.js!) and Shorthand will use whatever's available. If none is available, Shorthand will attempt to load the latest version jQuery (from cdnjs) for itself.

	<!-- Step 0: Include a specific DOM library, or not. -->
	<script src="//cdnjs.cloudflare.com/ajax/libs/zepto/1.0/zepto.min.js" type="text/javascript"></script>

    <!-- Step 1: Include Shorthand.js -->
    <script src="Shorthand.js" type="text/javascript"></script>

    <!-- Step 2: Add <script type='text/Shorthand'> blocks -->
    <script type="text/shorthand"> 
    	
    	Step 3: write Shorthand!
    	
    	Note that anything that doesn't match the syntax is ignored, so if you want to write out some comments like these you can.

    	Here's an example of a valid Shorthand statement that will show an element with id='dialog' when the element with id='button' is clicked:

    	#button should show #dialog on click

    	And here's a statement that will hide that dialog when the element with class='closebox' inside that dialog.

    	#dialog>.closebox should hide #dialog on click

    </script>

## Selectors

You can use any kind of CSS or jQuery-compatible selectors to specify which elements in your mockup should receive the intended behaviors - ID, class, tag name, whatever you like.

The only limitation on selectors is that they should not contain whitespace. So if you want to use a hierarchical selector like 'section > h1' simply write it as 'section>h1' and Shorthand will apply the behaviors to the correct elements as intended.

## Actions

This is the good stuff.

The first word after 'should' in your statement should be one of the valid actions. (There will be more, and it's easy to extend Shorthand's actions to add custom ones, if you're interested.)

Supported Actions:

* toggle (target selector)
* hide (target selector)
* show (target selector)
* toggleclass 'classname' (target selector)
* addclass 'classname' (target selector)
* removeclass 'classname' (target selector)
* goto 'url'
* load 'ajax url' (target selector)
* **more are on the way** - I'd like to add animations and transitions at the very least.

The word after the action is usually another selector to describe the target for the action. Sometimes it's a valid URL, as in the 'goto' or 'load' actions.

### Target Selectors

Target selectors describe the intended target for the action.  They can be vanilla CSS selectors like the main selector, or one of the special ones.

* self/itself 			-- targets the main source selector of the statement.
* next (selector)  		-- targets the element(s) next to the source element, optionally filtered by a provided selector.
* previous (selector) 	-- targets the element(s) previous to the source element, again filtered by an optional selector.

### Chaining with 'and'

Here's the really good stuff: you can chain multiple actions on a single main selector by simply using the 'and' keyword in your Shorthand statement.

    #button should toggle #dialog and toggleclass 'active' self and load 'dialog.html' #dialog>.content on click

See what I did there?


## Events

The last part of a Shorthand statement is the event that triggers the Action.

Events follow the 'on eventname' syntax, and eventname can be any valid DOM event, such as 'click', 'mouseover', 'mouseleave', 'touchstart', etc.

### Page Load Events

You can also specify that events happen on page load, by simply adding 'on load'.  This is great for handling initial setup of complex states, like hiding elements that will later be revealed.

    #dialog should hide itself on load

## License

MIT.


## Extending Shorthand

There's a simple way to use JavaScript to add custom actions to Shorthand's default library of actions.

In your own javascript:

    window.Shorthand.Actions.enlarge = function(origin, target) {
    	target = this.findTarget(target, arguments); // this is required for the magic target selectors to work, like 'self', 'next', and 'previous'
    	// After that line, you can do whatever you like here with the target DOM element.
    	target.css("font-size", "10em");
    }

If you develop useful Actions, please consider sending a pull request, and I'd be happy to include them in the defaults!

## Roadmap

I'd like to add a few things, and am open to contributions.

#### Server-side generation of JavaScript from Shorthand statements.

Ideally Shorthand could be run (via node.js) as part of a build script, and instead of evaluating statements and adding event handlers in-browser, the same statements could be used to generate an application skeleton of some kind.

#### Animation and Transition Actions

A library of simple canned animations useful for mockups? Yes please!

These would go something like this:

    #button1 should animate 'slideleftin' #panel1 on click

    #button2 should animate 'slideleftout' #panel2 on click

I'm still figuring out a good syntax for describing these...

