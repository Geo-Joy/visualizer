'use strict';

define(['require', 'modules/default/defaultview', 'src/util/util', 'src/util/api', 'src/util/domdeferred', 'src/util/datatraversing', 'src/util/typerenderer', 'src/util/context'], function (require, Default, Util, API, DomDeferred, Traversing, Renderer, Context) {

    function View() {
    }

    View.prototype = $.extend(true, {}, Default, {

        init: function () {

            var self = this,
                currentColSort;

            var toggle = this.module.getConfiguration('toggle');

            this.domTable = $('<table />', {cellpadding: 0, cellspacing: 0}).css({width: '100%'});
            this.domHead = $('<thead />').appendTo(this.domTable);
            this.domBody = $('<tbody />').appendTo(this.domTable);

            this.selected = [];

            // Mouseenter is better in this case because it will
            // not fire multiple times if the element has children
            this.domTable.on('mouseenter', 'tbody tr', function () {
                var dataRowId = $(this).index();

                if (!isNaN(dataRowId)) {
                    self.module.controller.lineHover(self.module.data, dataRowId);
                }

                // Mouseleave is better than mouseout in this case
            }).on('mouseleave', 'tbody tr', function () {

                var dataRowId = $(this).index();

                if (!isNaN(dataRowId)) {
                    self.module.controller.lineOut(self.module.data, dataRowId);
                }


            }).on('click', 'tr', function () {
                var $this = $(this);

                self.module.controller.lineClick(self.module.data, $this.index());

                if (toggle) {
                    if (toggle == 'single' && self.selected[0] !== undefined) {

                        self.module.controller.onToggleOff(self.module.data, self.selected[0]);
                        $this.parent().children().eq(self.selected[0]).toggleClass('toggled');

                        self.selected = [];
                    }

                    var index = $this.index();

                    if ($this.hasClass('toggled')) {
                        self.module.controller.onToggleOff(self.module.data, index);
                    } else {
                        self.module.controller.onToggleOn(self.module.data, index);
                    }

                    $this.toggleClass('toggled');

                    self.selected.push(index);
                }

            }).on('click', 'th', function () { // Sorting

                var jpathId = $(this).attr('data-jpath-number'),
                    data = self.module.getDataFromRel('list');

                if (!currentColSort || currentColSort.col !== jpathId) {

                    if (currentColSort) {
                        self.domTable.find('th[data-jpath-number="' + currentColSort.col + '"] .sort').remove();
                    }

                    currentColSort = {asc: true, col: jpathId, span: $('<div class="sort up"></div>')};

                    self.domTable.find('th[data-jpath-number="' + currentColSort.col + '"]').append(currentColSort.span);

                } else if (currentColSort.col === jpathId) {
                    currentColSort.asc = !currentColSort.asc;
                    currentColSort.span.toggleClass('up');
                }

                data.sort(function (a, b) {

                    return (currentColSort.asc ? 1 : -1) * ( self.jpaths[jpaths[jpathId].jpath](a) > self.jpaths[jpaths[jpathId].jpath](b) ? 1 : -1 );
                });

                self.module.model.dataTriggerChange(data);
                self.blank.list.call(self);
                self.update.list.call(self, data);
            });

            this.dom = this.domTable;
            this.module.getDomContent().html(this.dom);
            this.onResize();

            var jpaths = this.module.getConfiguration('colsjPaths'),
                l = jpaths.length,
                j = 0;

            this.colsjPaths = jpaths;
            this.jpaths = {};

            var thead = '<tr>';
            for (; j < l; j++) {

                if (!jpaths[j].jpath) {
                    continue;
                }

                Util.addjPathFunction(this.jpaths, jpaths[j].jpath);
                thead += '<th data-jpath-number="' + j + '">' + jpaths[j].name + '</th>';
            }
            thead += '</tr>';

            var colorjpath = this.module.getConfiguration('colorjPath');

            if (colorjpath) {

                this.colorjpath = Util.makejPathFunction(colorjpath);
            }

            this.domHead.html(thead);
            this.resolveReady();
        },

        unload: function () {

            this.module.getDomContent().empty();
        },


        applyFilterToRow: function (elId, rowId) {

            if (this.filter) {
                this.filter(this.jqGrid, this.elements[elId], rowId);
            }
        },


        blank: {

            list: function () {

                if (this.domBody) {
                    this.domBody.empty();
                }

                if (!this.module.data) {
                    return;
                }

                var i,
                    l = this.module.data.length;

                for (i = 0; i < l; i++) {
                    if (this.module.data[i] && this.module.data[i].unbindChange) {
                        this.module.data[i].unbindChange(this.module.getId());
                    }
                }
            }
        },

        update: {

            list: function (moduleValue) {
                if (moduleValue.type === 'string') {
                    return;
                }

                if (!moduleValue) {
                    return;
                }

                this.selected = [];

//	 			moduleValue = moduleValue.get();

                this.elements = moduleValue;

                var self = this,
                    nbLines = this.module.getConfiguration('nbLines') || 20,
                    html = '',
                    i = 0,
                    l = moduleValue.get().length;

                this.module.data = moduleValue;

                for (i = 0; i < l; i++) {

                    html += this.buildElement(moduleValue.getChildSync([i]), i);
                }

                this.domBody.html(html);

                // Debouncing the highlighting
                if (this.timeout) {
                    window.clearTimeout(this.timeout);
                }

                // Wait before setting the highlights
                this.timeout = window.setTimeout(function () {

                    API.killHighlight(self.module.getId());

                    for (i = 0; i < l; i++) {

                        (function (j) {

                            API.listenHighlight(self.module.data[j], function (val) {
                                self.doHighlight(j, val);
                            }, false, self.module.getId());

                            var dom = self.domBody.find('#' + self.module.getId() + '_' + j);

                            self.module.model.dataListenChange(self.module.data.get(j), function () {
                                dom.replaceWith(( dom = $(self.buildElement(this, j, true)) ));

                            }, 'list');

                            if (self.module.data.get(j).removable) {
                                Context.listen(dom.get(0), [
                                    [
                                        '<li><a><span class="ui-icon ui-icon-close"></span> Remove</a></li>',
                                        function () {
                                            self.onActionReceive.removeRowById.call(self, j);
                                        }
                                    ]
                                ]);
                            }
                        })(i);
                    }
                }, 1000); // 1 sec timeout

                this.list = true;
                this.showList = false; // Input data has changed,  showList must be reset.
                this.updateVisibility();
            },
            showList: function (value) {
                if (!Array.isArray(value)) {
                    return;
                }

                this.showList = value;
                this.updateVisibility();
            }

        },

        updateVisibility: function () {
            if (!this.showList || !this.list)
                return;

            var s = this.showList,
                l = s.length,
                el,
                id = this.module.getId() + '_';
            for (var i = 0; i < l; i++) {
                el = document.getElementById(id + i);
                s[i] ? el.removeAttribute('style') : el.setAttribute('style', 'display:none');
            }

        },

        buildElement: function (source, i) {

            var
                jpaths = this.colsjPaths,
                html = '',
                j,
                k = jpaths.length,
                currentVar;

            html += '<tr';

            if (this.colorjpath) {
                html += ' style="background-color: ' + this.colorjpath(source) + ';"';
            }

            html += ' id="' + this.module.getId() + '_' + i + '" ';
            html += '>';

            j = 0;
            for (; j < k; j++) {

                if (!jpaths[j].jpath) {
                    continue;
                }

                html += '<td>';
                currentVar = Traversing.get(this.getValue(Traversing.get(source), jpaths[j].jpath));
                if (typeof currentVar === 'undefined') {
                    currentVar = '';
                }
                html += currentVar;
                html += '</td>';
            }
            html += '</tr>';

            return html;
        },

        doHighlight: function (i, val) {
            this.domBody.find('tr').eq(i)[val ? 'addClass' : 'removeClass']('ci-highlight');
        },

        getValue: function (trVal, jpath) {

            if (!this.jpaths[jpath]) {
                return '';
            }

            return this.jpaths[jpath](trVal);
        },

        getDom: function () {
            return this.dom;
        },

        onActionReceive: {

            addRow: function (source) {

                this.elements = this.elements || [];

                if( this.module.getDataFromRel('list').indexOf( source ) > -1 ) {
                    return;
                }

                this.module.getDataFromRel('list').push(source);
                var l = this.elements.length - 1;

                var el = this.buildElement(source, l);
                this.domBody.append(el);
            },

            removeRow: function (source) {
                this.onActionReceive.removeRowById.call(this, this.module.getDataFromRel('list').indexOf(source));
            },

            removeRowById: function (rowId) {
                if (rowId < 0) {
                    return;
                }

                var el = this.module.getDataFromRel('list').splice(rowId, 1);
                el[0].unbindChange(this.module.getId());

                var index;

                if (( index = this.selected.indexOf(rowId) ) > -1) {
                    this.selected.splice(index, 1);
                }

                this.domBody.children().eq(rowId).remove();
            },

            toggleOff: function (source) {

                var index = this.module.getDataFromRel('list').indexOf(source);
                if (index == -1) {
                    return;
                }

                this.module.controller.onToggleOff(this.module.data, index);
                this.domBody.children().eq(index).removeClass('toggled');

            }

        },

        exportToTabDelimited: function () {
            if (!this.colsjPaths) {
                return;
            }

            var result = [];
            var allEls = [],
                i = 0,
                l = this.elements.length;

            var jpaths = this.colsjPaths;

            var header = [];
            for (var j = 0; j < jpaths.length; j++) {
                header.push(jpaths[j].name);
            }
            result.push(header.join('\t'));

            for (; i < l; i++) {
                var line = [];
                for (var j = 0; j < jpaths.length; j++) {
                    Traversing.getValueFromJPath(this.elements[i], jpaths[j].jpath).done(function (elVal) {
                        line.push(elVal);
                    });
                }
                result.push(line.join('\t'));
            }

            return (result.join('\r\n'));
        }

    });

    return View;

});