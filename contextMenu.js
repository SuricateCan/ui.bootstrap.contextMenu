angular.module('ui.bootstrap.contextMenu', [])
.service("contextMenuBuilder", function () {
    //Meni Item class
    function contextMenuItem(text, action) {
        //hold self
        var self = this;

        //menu item definitions
        self.text = text;
        self.icon = null;
        self.enabled = true;
        self.click = action;

        //set the text for this item
        self.setText = function (txt) {
            if (!angular.isDefined(txt) || (!angular.isFunction(txt) && !(txt instanceof String) && !angular.isFunction(txt.then)))
                throw 'The text should be a String, Function or Promise';
            self.text = txt;
            return self;
        };

        //set a text function to retrieve the text
        self.setTextFunction = function (fn) {
            if (!angular.isDefined(fn) || !angular.isFunction(fn))
                throw 'The setTextFunction accepts only Functions';
            return self.setText(fn);
        };

        //set a text promise to retrieve the text
        self.setTextPromise = function (promise) {
            if (!angular.isDefined(promise) || !angular.isFunction(promise.then))
                throw 'The setTextPromise accepts only Promises';
            return self.setText(promise);
        };

        //set the icon class to use on the menu item
        self.setIcon = function (icon) {
            if (!angular.isDefined(icon) || (!angular.isFunction(icon) && !(icon instanceof String)))
                throw 'The icon should be a String or Function';
            self.icon = icon;
            return self;
        };

        //set a function to retrieve the icon class
        self.setIconFunction = function (fn) {
            if (!angular.isDefined(fn) || !angular.isFunction(fn))
                throw 'The setIconFunction accepts only Functions';
            return self.setIcon(fn);
        }

        //set this item enabled state
        self.setEnabled = function (enabled) {
            if (!angular.isDefined(enabled) || (!angular.isFunction(enabled) && !(enabled instanceof Boolean)))
                throw 'The enabled should be a Boolean or Function';
            self.enabled = enabled;
            return self;
        };

        //set a function to retrieve the enabled state of this item
        self.setEnabledFunction = function (fn) {
            if (!angular.isDefined(fn) || !angular.isFunction(fn))
                throw 'The setEnabledFunction accepts only Functions';
            return self.setEnabled(fn);
        };

        //set the click action for this item
        self.setClick = function (fn) {
            if (!angular.isDefined(fn) || !angular.isFunction(fn))
                throw 'The setClick accepts only Functions';
            self.click = fn;
            return self;
        };
    };

    //Builder class
    function contextMenuBuilder() {
        //hold self
        var self = this;
        //menu item list
        var lst = [];

        //create and add a new menu item at the given position
        //returns the menu item instance
        self.newMenuItemAt = function (idx, text, fnAction) {
            //instantiate new item
            var item = new contextMenuItem(text, fnAction);
            //add the internal list
            lst.splice(idx, 0, item);
            //return to build the rest
            return item;
        };

        //create and add a new menu item
        //returns the menu item instance
        self.newMenuItem = function (text, fnAction) {
            return self.newMenuItemAt(lst.length, text, fnAction);
        };

        //add a separator at the given position
        self.addSeparatorAt = function (idx) {
            lst.splice(idx, 0, null);
        };

        //add a separator to the current position
        self.addSeparator = function () {
            self.addSeparatorAt(lst.length);
        };

        //remove the menu item in the given position
        self.removeAt = function (idx) {
            lst.splice(idx, 1);
        };

        //remove last menu item
        self.removeLast = function () {
            self.removeAt(lst.length - 1);
        };

        //clear all items from the menu
        self.clear = function () {
            lst.splice(0, lst.length);
        };

        //return the array representation
        self._toArray = function () {
            return lst;
        };
    };

    //return builder factory
    return function () {
        return new contextMenuBuilder();
    };
})
.directive('contextMenu', ["$parse", "$q", function ($parse, $q) {
    if (!$) { var $ = angular.element; }
    var renderMenuItem = function ($contextMenu, $scope, event, item, model, onClose) {
        var itemdef = item;
        //legacy: convert the array into a contextMenuItem mirror
        if (item instanceof Array) {
            itemdef = {
                text: item[0],
                click: item[1],
                enabled: item[2] || true //defaults to true
            };
        }
        //check the definition validity
        if (!itemdef.text) { throw 'A menu item needs a text'; }
        else if (!itemdef.click) { throw 'A menu item needs a click function'; }
        //setup the anchor
        var $a = $('<a>').attr({ tabindex: '-1', href: '#' });
        //check for an icon
        if (itemdef.icon) {
            //get the icon, no promises here
            var icon = angular.isFunction(itemdef.icon) ? itemdef.icon.call($scope, $scope, event, model) : itemdef.icon;
            var $i = $('<i>').addClass(icon);
            $a.append($i).append(' ');//append space to separate the icon from the text
        }
        //if function, get the text, otherwise, the $q will take care of it
        var text = angular.isFunction(itemdef.text) ? itemdef.text.call($scope, $scope, event, model) : itemdef.text;
        //resolve the text
        $q.when(text).then(function (txt) { $a.append(txt); });
        //create the li and append the anchor
        var $li = $('<li>').append($a);
        //check the enabled function
        var enabled = angular.isFunction(itemdef.enabled) ? itemdef.enabled.call($scope, $scope, event, text, model) : itemdef.enabled;
        if (enabled) {
            $li.on('click', function ($event) {
                $event.preventDefault();
                $scope.$apply(function () {
                    $(event.currentTarget).removeClass('context');
                    $contextMenu.remove();
                    itemdef.click.call($scope, $scope, event, model);
                    $scope.$eval(onClose);
                });
            });
        } else {
            //disable and prevent propagation
            $li.addClass('disabled').on('click', function ($event) { $event.preventDefault(); });
        }
        return $li;
    };
    var renderContextMenu = function ($scope, event, options, model, onClose) {
        var $target = $(event.currentTarget).addClass('context');
        var $contextMenu = $('<div>').addClass('ng-bootstrap-contextmenu dropdown clearfix');
        var $ul = $('<ul>')
            .addClass('dropdown-menu')
            .attr({ 'role': 'menu' })
            .css({
                display: 'block',
                position: 'absolute',
                left: event.pageX + 'px',
                top: event.pageY + 'px'
            });
        angular.forEach(options, function (item, i) {
            if (item === null) {
                $ul.append($('<li>').addClass('divider'));
            } else {
                $ul.append(renderMenuItem($contextMenu, $scope, event, item, model, onClose));
            }
        });
        $contextMenu.append($ul);
        var height = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        $contextMenu.css({
            width: '100%',
            height: height + 'px',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });
        $(document).find('body').append($contextMenu);
        $contextMenu.on("mousedown", function (e) {
            if ($(e.target).hasClass('dropdown')) {
                $target.removeClass('context');
                $contextMenu.remove();
                $scope.$eval(onClose);
            }
        }).on('contextmenu', function (ev) {
            $(ev.currentTarget).removeClass('context');
            ev.preventDefault();
            $contextMenu.remove();
            $scope.$eval(onClose);
        });
    };
    return function ($scope, element, attrs) {
        element.on('contextmenu', function (event) {
            event.stopPropagation();
            $scope.$apply(function () {
                event.preventDefault();
                var options = $scope.$eval(attrs.contextMenu);
                var model = $scope.$eval(attrs.model);
                if (angular.isFunction(options._toArray)) {
                    options = options._toArray();
                }
                if (options instanceof Array) {
                    var open = angular.isDefined(attrs.opening) ? $scope.$eval(attrs.opening) : true;
                    if (options.length === 0 || !open) {
                        return;
                    }
                    renderContextMenu($scope, event, options, model, attrs.close);
                    $scope.$eval(attrs.open);
                } else {
                    throw '"' + attrs.contextMenu + '" is not an array nor a contextMenuBuilder';
                }
            });
        });
    };
}]);
