#contextMenu

AngularJS UI Bootstrap Module for adding context menus to elements. [Demo](http://codepen.io/templarian/pen/VLKZLB)

`bower install angular-bootstrap-contextmenu`

[![Example](http://templarian.com/files/angularjs_contextmenu.png)](http://codepen.io/templarian/pen/VLKZLB)

## Usage

Add a reference to `contextMenu.js`. In your app config add `ui.bootstrap.contextMenu` as a dependency module.

There are two ways of setting up a context menu: by template or by options.

### By Template

To setup the context by a html template, you need to provide an `<ul>` with the attribute `context-menu-template`.The value of this attribute is a string to identify the context-menu owning it.

```html
<div>
    <div ng-repeat="item in items" context-menu="custom">Right Click: {{item.name}}</div>
    <ul context-menu-template="custom">
      <li><i class="fa fa-check"></i><a ng-click="select(item)">Select</a></li>
      <li class="divider"></li>
      <li ng-class="{'disabled':item.otherProperty!='Foo'}"><a ng-click="item.otherProperty!='Foo' || remove(item)">Remove</a></li>
    </ul>
</div>
<div ng-bind="selected"></div>
```
`ngDisabled` does not work with `a`, so if you want to use it you'll need to replace the `a` with `button` and style it accordingly.
Above we used lazy evaluation to prevent the click behaviour when disabled.
You can use ngClick and all ngRepeat scope functions.

```js
$scope.selected = 'None';
$scope.items = [
    { name: 'John', otherProperty: 'Foo' },
    { name: 'Joe', otherProperty: 'Bar' }
};
$scope.select = function(item){
  $scope.selected = $itemScope.item.name;
};
$scope.remove = function(item){
  $scope.items.splice($scope.items.indexOf(item), 1);
};
```

### By Menu Options

To setup the context by menu options you need to provide an object model that defines the context.

```html
<div>
    <div ng-repeat="item in items" context-menu="menuOptions">Right Click: {{item.name}}</div>
</div>
<div ng-bind="selected"></div>
```

A menu options model can be a `contextMenuBuilder`, an `Array`, or a `Function` returning one of those.
An empty `contextMenuBuilder` or `Array` will not display a context menu.
The following uses the `contextMenuBuilder` to provide the context definition.

```js
$scope.selected = 'None';
$scope.items = [
    { name: 'John', otherProperty: 'Foo' },
    { name: 'Joe', otherProperty: 'Bar' }
};

var builder = contextMenuBuilder();
builder.newMenuItem('Select', function ($itemScope) {
    $scope.selected = $itemScope.item.name;
});
builder.addSeparator();
builder.newMenuItem('Remove', function ($itemScope) {
    $scope.items.splice($itemScope.$index, 1);
});

$scope.menuOptions = builder;
```

### Menu Options as `Function`

```html
<div ng-repeat="item in items" context-menu="menuOptions(item)">Right Click: {{item.name}}</div>
```

Returning an `Array`:
```js
$scope.menuOptions = function (item) {
    if (item.name == 'John') { return []; }
    return [{
		text: function ($itemScope) {
            return $itemScope.item.name;
        },
		click: function ($itemScope) {
            // Action
        }
	}];
};
```

Returning a `contextMenuBuilder`:
```js
$scope.menuOptions = function (item) {
	var builder = contextMenuBuilder();
    if (item.name != 'John') { 
		builder.newMenuItem(function ($itemScope) {
            return $itemScope.item.name;
        },
		function ($itemScope) {
            // Action
        });
	}
	return builder;
};
```

### Menu Options as `Array`

Using an `Array` to build your options, every item is an object with the properties below.
To add a separator, leave the item as `null`;

```js
[{
	text: "item name",
	icon: "icon class",
	enabled: true,
	click: function($itemScope, $event, $model){}
},
...
]
```

The properties definitions are:

Property | Type | Details
---------|------|--------
text | `String`, `Function`, `Promise` | The text property will define the text that will appear for the menu item. If `String`, the literal will be put in the item. If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be put in the item. If `Promise`, the resolve of the promise will be put in the item.
icon (optional) | `String`, `Function` | The icon property is the class that will be appended to `<i>` in the menu item. If this property is not present, no icon will be inserted. If `String`, the literal will be added as class. If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be added as class.
enabled (optional) | `Boolean`, `Function` | The enabled property will define if the item will be clickable or disabled. Defaults to `true`. If `Boolean`, the item will ALWAYS be enabled (when true) or disabled (when false). If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The `Boolean` result of it will determine if the item is clickable or not.
click | `Function` | The click property is the action that will be called when the item is clicked. The function will be called with params `$itemScope`, `$event`, `$model`.

### Menu Options as `contextMenuBuilder`

Using a builder to construct your context menu is the recommended approach.

#### `contextMenuBuilder`

The `contextMenuBuilder` has the following methods:

##### newMenuItem([text],[fnAction]);

Create and add a new item to the context menu at the current position.

Param | Type | Details
------|------|--------
text (optional) | `String`, `Function`, `Promise` | The text param will define the text that will appear for the menu item. If `String`, the literal will be put in the item. If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be put in the item. If `Promise`, the resolve of the promise will be put in the item.
fnAction (optional) | `Function` | The fnAction param is the action that will be called when the item is clicked. The function will be called with params `$itemScope`, `$event`, `$model`.

###### Returns

`contextMenuItem`	The return is an instance of a `contextMenuItem` containing functions to help setup the item.

##### newMenuItemAt(index, [text],[fnAction]);

Create and add a new item to the context menu at the given position.

Param | Type | Details
------|------|--------
index | `Number` | The index to insert the new menu item at.
text (optional) | `String`, `Function`, `Promise` | The `text` param will define the text that will appear for the menu item. If `String`, the literal will be put in the item. If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be put in the item. If `Promise`, the resolve of the promise will be put in the item.
fnAction (optional) | `Function` | The fnAction param is the action that will be called when the item is clicked. The function will be called with params `$itemScope`, `$event`, `$model`.

###### Returns

`contextMenuItem`	The return is an instance of a `contextMenuItem` containing functions to help setup the item.

##### addSeparator();

Add a separator to the context menu at the current position.

##### addSeparatorAt(index);

Add a separator to the context menu at the given position.

Param | Type | Details
------|------|--------
index | `Number` | The index to insert the separator at.

##### removeLast();

Remove the last menu item.

##### removeAt(index);

Remove the menu item at the given position.

Param | Type | Details
------|------|--------
index | `Number` | The index to remove the item from

##### clear();

Remove all menu items.

#### `contextMenuItem`

The `contextMenuItem` is an object that holds the whole item definition and contains various functions to help you set it up.
It contains the followig properties and methods:

Property | Type | Details
---------|------|--------
text | `String`, `Function`, `Promise` | The text property will define the text that will appear for the menu item. If `String`, the literal will be put in the item. If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be put in the item. If `Promise`, the resolve of the promise will be put in the item.
icon | `String`, `Function` | The icon property is the class that will be appended to `<i>` in the menu item. If this property is left undefined, no icon will be inserted. If `String`, the literal will be added as class. If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be added as class.
enabled | `Boolean`, `Function` | The enabled property will define if the item will be clickable or disabled. Defaults to `true`. If `Boolean`, the item will ALWAYS be enabled (when true) or disabled (when false). If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The `Boolean` result of it will determine if the item is clickable or not.
click | `Function` | The click property is the action that will be called when the item is clicked. The function will be called with params `$itemScope`, `$event`, `$model`.

##### setText(text)

Set the text property of the menu item.

Param | Type | Details
------|------|--------
text | `String`, `Function`, `Promise` | If `String`, the literal will be put in the item. If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be put in the item. If `Promise`, the resolve of the promise will be put in the item.

###### Returns

`contextMenuItem`	Returns the self instance to enable chain calls.

##### setTextFunction(fn)

Wrapper for the `setText` function that accepts only function.

Param | Type | Details
------|------|--------
fn | `Function` | The function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be put in the item.

###### Returns

`contextMenuItem`	Returns the self instance to enable chain calls.

##### setTextPromise(promise)

Wrapper for the `setText` function that accepts only promises.

Param | Type | Details
------|------|--------
promise | `Promise` | The resolve of the promise will be put in the item.

###### Returns

`contextMenuItem`	Returns the self instance to enable chain calls.

##### setIcon(icon)

Set the icon property of the menu item.

Param | Type | Details
------|------|--------
icon | `String`, `Function` | If `String`, the literal will be added as class. If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be added as class.

###### Returns

`contextMenuItem`	Returns the self instance to enable chain calls.

##### setIconFunction(fn)

Wrapper for the `setIcon` function that accepts only functions.

Param | Type | Details
------|------|--------
icon | `Function` | The function will be called with params `$itemScope`, `$event`, `$model`. The result of it will be added as class.

###### Returns

`contextMenuItem`	Returns the self instance to enable chain calls.

##### setEnabled(enabled)

Set the enabled property of the menu item.

Param | Type | Details
------|------|--------
enabled | `Boolean`, `Function` | If `Boolean`, the item will ALWAYS be enabled (when true) or disabled (when false). If `Function`, the function will be called with params `$itemScope`, `$event`, `$model`. The `Boolean` result of it will determine if the item is clickable or not.

###### Returns

`contextMenuItem`	Returns the self instance to enable chain calls.

##### setEnabledFunction(fn)

Wrapper for the `setEnabled` function that accepts only functions.

Param | Type | Details
------|------|--------
enabled | `Function` | The function will be called with params `$itemScope`, `$event`, `$model`. The `Boolean` result of it will determine if the item is clickable or not.

###### Returns

`contextMenuItem`	Returns the self instance to enable chain calls.

##### setClick(fn)

Set the click property of the menu item.

Param | Type | Details
------|------|--------
click | `Function` | The function will be called with params `$itemScope`, `$event`, `$model`.

###### Returns

`contextMenuItem`	Returns the self instance to enable chain calls.

## Model Attribute (optional)

In instances where a reference is not passed through the `$itemScope` (i.e. not using `ngRepeat`), there is a `model` attribute that can pass a value.

```html
<div context-menu="menuOptions" model="expression">Some item name here</div>
```

The `model` is evaluated as an expression using `$scope.$eval` and passed as the third argument.

```js
var builder = contextMenuBuilder();
builder.newMenuItem(function ($itemScope, $event, $model) {
		return $itemScope.item.name;
	},
	function ($itemScope, $event, $model) {
		// Action
	})
	.setEnabled(function($itemScope, $event, text, $model){
	    // Enable or Disable
        return true; // enabled = true, disabled = false
	});
$scope.menuOptions = builder;
```

## Context Menu Events

The context menu supports these three events:

Event | Details
------|--------
opening | This event happens before the context menu is open and it must return a `Boolean`. If the return is false, the context will not be shown.
open | This event happens after the context menu is open. Its return is irrelevant.
close | This event happens after the context menu is closed. Its return is irrelevant.

### Adding handlers

To handle any of these events, add a tag with the same name to the context menu tag.

```html
<div>
    <div ng-repeat="item in items" context-menu="menuOptions" opening="willOpen(item)" open="onOpen(item)" close="onClose(item)">Right Click: {{item.name}}</div>
</div>
```

The expression on the events will be evaluated using `$scope.$eval`.

```js
$scope.willOpen = function(item) {
	//Do something
	return true; // true will show the context, false will not
};

$scope.onOpen = function(item) {
	//Do something
};

$scope.onClose = function(item) {
	//Do something
};
```

## Style Overlay

The `<div>` holding the menu item list is decorated with the class `ng-bootstrap-contextmenu`.

Also to give a light darker disabled tint while the menu is open add the style below.

```css
body > .dropdown {
    background-color: rgba(0, 0, 0, 0.1);
}
```

## Limitations (work in progress)

Nested lists are not supported yet, because I have not needed it yet. If you add it please do a pull request.

```JS
$scope.menuOptions = [
    ['Parent Item 1', function ($itemScope) {
        // Code
    },  ['Child Item 1', function ($itemScope) {
            // Code
        }],
        ['Child Item 2', function ($itemScope) {
            // Code
        }]
    ]
];
```
