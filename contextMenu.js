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
.service('_contextMenuWorker', ["$q", "$timeout", function ($q, $timeout) {
    var self = this;
    if (!$) { var $ = angular.element; }
    var callMenuItemClick = function (itemdef, $scope, $event, model) {
        itemdef.click.call($scope, $scope, $event, model);
    };
    var callMenuItemClose = function ($scope, $ctrl) {
        $timeout(function () {
            $scope.$eval($ctrl.closeExpr);
        });
    };
    var callMenuItemOpen = function ($scope, $ctrl) {
        $timeout(function () {
            $scope.$eval($ctrl.openExpr);
        });
    };
    var callMenuItemOpening = function ($scope, $ctrl) {
        return $ctrl.openingExpr ? $scope.$eval($ctrl.openingExpr) : true;
    };
    var liClickHandler = function ($scope, $e, $event, $contextMenu, $ctrl, model, itemdef, callClick) {
        $e.preventDefault();
        $scope.$apply(function () {
            $($event.currentTarget).removeClass('context');
            $contextMenu.remove();
            if (callClick) callMenuItemClick(itemdef, $scope, $event, model);
            callMenuItemClose($scope, $ctrl);
        });
    };
    var renderMenuItem = function ($contextMenu, $scope, $event, item, model, $ctrl) {
        var itemdef = item;
        //LEGACY: convert the array into a contextMenuItem mirror
        if (item instanceof Array) {
            itemdef = {
                text: item[0],
                click: item[1],
                enabled: item.length > 2 ? item[2] : true //defaults to true
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
            var icon = angular.isFunction(itemdef.icon) ? itemdef.icon.call($scope, $scope, $event, model) : itemdef.icon;
            var $i = $('<i>').addClass(icon);
            $a.append($i).append(' ');//append space to separate the icon from the text
        }
        //if function, get the text, otherwise, the $q will take care of it
        var text = angular.isFunction(itemdef.text) ? itemdef.text.call($scope, $scope, $event, model) : itemdef.text;
        //resolve the text
        $q.when(text).then(function (txt) { $a.append(txt); });
        //create the li and append the anchor
        var $li = $('<li>').append($a);
        //check the enabled function
        var enabled = angular.isFunction(itemdef.enabled) ? itemdef.enabled.call($scope, $scope, $event, text, model) : itemdef.enabled;
        $li.on('click', function (e) {
            liClickHandler($scope, e, $event, $contextMenu, $ctrl, model, itemdef, enabled);
        });
        if (!enabled) $li.addClass('disabled');
        return $li;
    };
    var renderContextMenu = function ($scope, $event, options, model, $ctrl) {
        var $target = $($event.currentTarget).addClass('context');
        var $contextMenu = $('<div>').addClass('ng-bootstrap-contextmenu dropdown clearfix');
        var $ul = null;
        //check if we will use a template or the options
        if ($ctrl.fnTemplateLink) {
            //link the scope to a clone template
            $ctrl.fnTemplateLink($scope, function (clone) {
                $ul = clone;
            });
            $ul.find('li').on('click', function (e) {
                liClickHandler($scope, e, $event, $contextMenu, $ctrl, model, null, false);
            });
        } else {
            //create the ul and build the list
            $ul = $('<ul>');
            angular.forEach(options, function (item, i) {
                if (item === null) {
                    $ul.append($('<li>').addClass('divider'));
                } else {
                    $ul.append(renderMenuItem($contextMenu, $scope, $event, item, model, $ctrl));
                }
            });
        }
        //format the ul
        $ul.addClass('dropdown-menu')
            .attr({ 'role': 'menu' })
            .css({
                display: 'block',
                position: 'absolute',
                left: $event.pageX + 'px',
                top: $event.pageY + 'px'
            });
        //append to the div
        $contextMenu.append($ul);
        //calculate height
        var height = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        //format the context menu div
        $contextMenu.css({
            width: '100%',
            height: height + 'px',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });
        //add to the page
        $(document).find('body').append($contextMenu);
        //context menu control events
        $contextMenu.on("mousedown", function (e) {
            if ($(e.target).hasClass('dropdown')) {
                $target.removeClass('context');
                $contextMenu.remove();
                //call the close function
                $timeout(function () { $scope.$eval($ctrl.closeExpr); });
            }
        })
        .on('contextmenu', function (e) {
            $(e.currentTarget).removeClass('context');
            e.preventDefault();
            $contextMenu.remove();
            //call the close function
            $timeout(function () { $scope.$eval($ctrl.closeExpr); });
        });
    };
    self.bindContextMenu = function ($scope, $element, $attrs, $controller) {
        //context menu event
        $element.on('contextmenu', function ($event) {
            //only our context must open
            $event.stopPropagation();
            $scope.$apply(function () {
                $event.preventDefault();
                //get the scope's options and model
                var options = $scope.$eval($controller.optionsExpr);
                var model = $scope.$eval($controller.modelExpr);
                //work the options, if builder
                if (angular.isFunction(options._toArray)) {
                    options = options._toArray();
                }
                //builder delivers an array
                if (options instanceof Array) {
                    var open = callMenuItemOpening($scope, $controller);
                    //check if we will open or not
                    if (options.length === 0 || !open) {
                        return;
                    }
                    //render the menu
                    renderContextMenu($scope, $event, options, model, $controller);
                    callMenuItemOpen($scope, $controller);
                } else {
                    throw '"' + $controller.optionsExpr + '" is not an array nor a contextMenuBuilder';
                }
            });
        });
    };
}])
.directive('contextMenu', ["$compile", "$rootElement", "_contextMenuWorker", function ($compile, $rootElement, _contextMenuWorker) {
    return {
        restrict: 'A',
        priority: 1001,//we must run our compile before ngRepeat for this to work
        controller: function () {
            var self = this;
            //hold the template link function
            self.fnTemplateLink = null;
            //hold the options expression
            self.optionsExpr = null;
            //hold the model expresion
            self.modelExpr = null;
            //hold the event expressions
            self.openingExpr = null;
            self.openExpr = null;
            self.closeExpr = null;
        },
        compile: function ($element, $attrs) {
            //get the template view related to our context and remove it
            var $tmpl = $rootElement.find('[context-menu-template="' + $attrs.contextMenu + '"]').remove();
            var useTemplate = $tmpl.length > 0;
            //if a template was provided
            if (useTemplate) {
                if (!$tmpl.is("ul")) throw "context-menu-template must be a <ul>";
            }
            else if (!$attrs.contextMenu) {
                throw "context-menu needs a context-menu-template child or its options set";
            }

            //remove ourselves
            $element.remove("context-menu");
            //add our run directive that will execute on each ngRepeat element
            $element.attr("context-menu-run", "");

            //return our link function
            return function ($scope, $elem, $att, $controller) {
                //fill our controller properties
                $controller.optionsExpr = $attrs.contextMenu;
                $controller.modelExpr = $attrs.model;
                $controller.openingExpr = $attrs.opening;
                $controller.openExpr = $attrs.open;
                $controller.closeExpr = $attrs.close;
                if (useTemplate) {
                    $controller.fnTemplateLink = $compile($tmpl);
                } else {
                    //no template, bind now
                    _contextMenuWorker.bindContextMenu($scope, $elem, $att, $controller);
                }
                $scope.$on("$destroy", function () {
                    //clear references
                    $controller.optionsExpr = null;
                    $controller.modelExpr = null;
                    $controller.openingExpr = null;
                    $controller.openExpr = null;
                    $controller.fnTemplateLink = null;
                    $controller = null;
                });
            }
        }
    }
}])
.directive('contextMenuRun', ["$timeout", "$q", "_contextMenuWorker", function ($timeout, $q, _contextMenuWorker) {
    return {
        restrict: 'A',
        priority: 999,//to run after the item scope has been created
        require: 'contextMenu',
        link: function ($scope, $element, $attrs, $controller) {
            _contextMenuWorker.bindContextMenu($scope, $element, $attrs, $controller);
        }
    }
}]);
