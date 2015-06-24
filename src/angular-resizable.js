angular.module('angularResizable', [])
    .directive('resizable', function() {
        var toCall;
        function throttle(fun) {
            if (toCall === undefined) {
                toCall = fun;
                setTimeout(function() {
                    toCall();
                    toCall = undefined;
                }, 100);
            } else {
                toCall = fun;
            }
        }
        return {
            restrict: 'AE',
            scope: {
                rDirections: '=',
                rCenteredX: '=',
                rCenteredY: '=',
                rWidth: '=',
                rHeight: '=',
                rFlex: '=',
                rGrabber: '@',
                rDisabled: '@'
            },
            link: function(scope, element, attr) {

                // register watchers on width and height attributes if they are set
                scope.$watch('rWidth', function(value){
                    element[0].style.width = scope.rWidth + 'px';
                });
                scope.$watch('rHeight', function(value){
                    element[0].style.height = scope.rHeight + 'px';
                });

                element.addClass('resizable');

                var style = window.getComputedStyle(element[0], null),
                    w,
                    h,
                    dir = scope.rDirections,
                    vx = scope.rCenteredX ? 2 : 1, // if centered double velocity
                    vy = scope.rCenteredY ? 2 : 1, // if centered double velocity
                    inner = scope.rGrabber ? scope.rGrabber : '<span></span>',
                    start,
                    dragDir,
                    axis,
                    info = {};

                var updateInfo = function() {
                    info.width = false; info.height = false;
                    if(axis === 'x')
                        info.width = parseInt(element[0].style[scope.rFlex ? 'flexBasis' : 'width']);
                    else
                        info.height = parseInt(element[0].style[scope.rFlex ? 'flexBasis' : 'height']);
                    info.id = element[0].id;
                };

                var dragging = function(e) {
                    var prop, offset = axis === 'x' ? start - e.clientX : start - e.clientY;
                    switch(dragDir) {
                        case 'top':
                        case 'bottom':
                            prop = scope.rFlex ? 'flexBasis' : 'height';
                            element[0].style[prop] = h + (offset * vy) + 'px';
                            break;
                        case 'right':
                        case 'left':
                            prop = scope.rFlex ? 'flexBasis' : 'width';
                            element[0].style[prop] = w - (offset * vx) + 'px';
                            break;
                    }
                    updateInfo();
                    throttle(function() { scope.$emit('angular-resizable.resizing', info);});
                };
                var dragEnd = function(e) {
                    updateInfo();
                    scope.$emit('angular-resizable.resizeEnd', info);
                    scope.$apply();
                    document.removeEventListener('mouseup', dragEnd, false);
                    document.removeEventListener('mousemove', dragging, false);
                    element.removeClass('no-transition');
                };
                var dragStart = function(e, direction) {
                    dragDir = direction;
                    axis = dragDir === 'left' || dragDir === 'right' ? 'x' : 'y';
                    start = axis === 'x' ? e.clientX : e.clientY;
                    w = parseInt(style.getPropertyValue('width'));
                    h = parseInt(style.getPropertyValue('height'));

                    //prevent transition while dragging
                    element.addClass('no-transition');

                    document.addEventListener('mouseup', dragEnd, false);
                    document.addEventListener('mousemove', dragging, false);

                    // Disable highlighting while dragging
                    if(e.stopPropagation) e.stopPropagation();
                    if(e.preventDefault) e.preventDefault();
                    e.cancelBubble = true;
                    e.returnValue = false;

                    updateInfo();
                    scope.$emit('angular-resizable.resizeStart', info);
                    scope.$apply();
                };

                for(var i=0;i<dir.length;i++) {
                    (function () {
                        var grabber = document.createElement('div'),
                            direction = dir[i];

                        // add class for styling purposes
                        grabber.setAttribute('class', 'rg-' + dir[i]);
                        grabber.innerHTML = inner;
                        element[0].appendChild(grabber);
                        grabber.ondragstart = function() { return false; };
                        grabber.addEventListener('mousedown', function(e) {
                          disabled = (scope.rDisabled === 'true');
                          if (!disabled && e.which === 1) {
                            // left mouse click
                            dragStart(e, direction);
                          }
                        }, false);
                    }());
                }

            }
        };
    });
