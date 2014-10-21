'use strict';

require.config({
    paths: {
        // jQuery & jQuery UI

        dragevent:     'components/slickgrid/lib/jquery.event.drag-2.2',
        dropevent:     'components/slickgrid/lib/jquery.event.drop-2.2',

        // SlickGrid
        slickcore:     'components/slickgrid/slick.core',
        slickgrid:     'components/slickgrid/slick.grid',
        slickdataview: 'components/slickgrid/slick.dataview'
    },
    shim: {
        dragevent:     ['jquery'],
        dropevent:     ['jquery'],
        slickcore:     ['jqueryui', 'components/jquery/jquery-migrate.min'],
        slickgrid:     ['slickcore', 'dragevent', 'dropevent','components/slickgrid/plugins/slick.cellrangedecorator',
            'components/slickgrid/plugins/slick.cellrangeselector' ,
            'components/slickgrid/plugins/slick.cellselectionmodel' ,
            'components/slickgrid/slick.formatters',
            'modules/types/edition/slick_grid/slick.editors.custom'],
        slickdataview: ['slickgrid']

    }
});


define(['require', 'modules/default/defaultview', 'src/util/debug', 'lodash', 'src/util/util', 'src/util/api', 'src/util/typerenderer','src/util/datatraversing', 'slickgrid', 'slickdataview'], function(require, Default, Debug, _, Util, API, Renderer, Traversing) {
    function View() {}
    Util.loadCss('./components/slickgrid/slick.grid.css');


    var formatters = {
        typerenderer: waitingFormatter,
        'slick.text': Slick.Formatters.Text,
        'slick.percent': Slick.Formatters.PercentComplete,
        'slick.percentbar': Slick.Formatters.PercentCompleteBar,
        'slick.yesno': Slick.Formatters.YesNoSelect
    };

    var editors = {
        'slick.text': Slick.Editors.Text,
        'slick.longtext': Slick.Editors.LongText,
        'slick.checkbox': Slick.Editors.Checkbox,
        'slick.date': Slick.Editors.Date,
        'slick.yesno': Slick.Editors.YesNoSelect,
        'slick.percent': Slick.Editors.PercentComplete,
        'slick.integer': Slick.Editors.Integer
    };
    var typeEditors = {
        boolean: Slick.Editors.Checkbox,
        mf: Slick.Editors.TextValue,
        color: Slick.Editors.ColorValue,
    };

    View.prototype = $.extend(true, {}, Default, {

        init: function() {
            if (! this.$dom) {
                this._id = Util.getNextUniqueId();
                this.$dom = $('<div>').attr('id', this._id).css({
                    width: '100%',
                    height: '100%'
                });
                this.module.getDomContent().html(this.$dom);
                //$('body').append(this.$dom);
            }


            this.slick = {};
            this.colConfig = this.module.getConfiguration('colsjPaths');
            this.resolveReady();
        },


        getSlickColumns: function() {
            var that = this;
            var tp = $.proxy(typeRenderer, this);
            return this.colConfig.map(function(row) {
                if(row.editor === 'auto' && that.module.data) {
                    var type = that.module.data.get(0).getChildSync(row.jpath).type;
                    var editor = typeEditors[type];
                }
                return {
                    id: row.name,
                    name: row.name,
                    field: row.name,
                    width: +row.width || undefined,
                    minWidth: +row.minWidth || undefined,
                    maxWidth: +row.maxWidth || undefined,
                    resizable: row.resizable.indexOf('yes') > -1 ? true : undefined,
                    selectable: row.selectable.indexOf('yes') > -1 ,
                    focusable: row.focusable.indexOf('yes') > -1,
                    sortable: row.sortable.indexOf('yes') > -1,
                    defaultSortAsc: row.defaultSortAsc.indexOf('yes') > -1,
                    editor: editor || editors[row.editor],
                    formatter: formatters[row.formatter],
                    asyncPostRender: (row.formatter === 'typerenderer') ? tp : undefined,
                    jpath: row.jpath
                }
            });
        },

        getSlickOptions: function() {
            var that = this;
            return {
                editable: that.module.getConfigurationCheckbox('slickCheck', 'editable'),
                enableAddRow: that.module.getConfigurationCheckbox('slickCheck', 'enableAddRow'),
                enableCellNavigation: that.module.getConfigurationCheckbox('slickCheck', 'enableCellNavigation'),
                autoEdit: that.module.getConfigurationCheckbox('slickCheck', 'autoEdit'),
                enableTextSelectionOnCells: that.module.getConfigurationCheckbox('slickCheck', 'enableTextSelectionOnCells'),
                enableColumnReorder: that.module.getConfigurationCheckbox('slickCheck', 'enableColumnReorder'),
                forceFitColumns: that.module.getConfigurationCheckbox('slickCheck', 'forceFitColumns'),
                asyncEditorLoading: true,
                enableAsyncPostRender: true,
                asyncPostRenderDelay: 0,
                dataItemColumnValueExtractor: function(item, coldef) {
                    return item;
                }
            };
        },

        getSlickData: function(value) {
            var data;
            data = [];
            for(var i=0; i<value.length; i++) {
                var d;
                data[i] = (d={});
                for(var j=0; j<this.colConfig.length; j++) {
                    d[this.slick.columns[j].field] = value.get(i).getChildSync(this.colConfig[j].jpath);
                }
            }
            return data;
        },

/*
        getSlickData: function(value) {
            var that = this;
            var data;
            data = [];
            var promises = [];
            for(var i=0; i<value.length; i++) {
                var d;
                data[i] = (d={});
                for(var j=0; j<this.colConfig.length; j++) {
                    promises.push(value.get(i).getChild(this.colConfig[j].jpath));
                }

            }

            return Promise.all(promises).then(function(x) {
                var data = [];
                for(var i=0; i<value.length; i++) {
                    var d;
                    data[i] = (d={});
                    for(var j=0; j<data.length; j++) {
                        d[that.slick.columns[j].field] = x[i*value.length+j];
                    }
                }
                return data;
            });


        },
*/


        updateSlickItem: function(value, idx, item) {
            for(var j=0; j<this.colConfig.length; j++) {
                item[this.slick.columns[j].field] = value.get(idx).getChildSync(this.colConfig[j].jpath);
            }
        },

        inDom: function(){




        },

        update: {

            list: function( moduleValue ) {

                var that =  this;
                var l = moduleValue.get().length;
                this.module.data = moduleValue;

                this.slick.columns = this.getSlickColumns();
                this.slick.options = this.getSlickOptions();
                this.slick.data = this.module.data;
                //this.slick.data = this.getSlickData(moduleValue);

                //this.slick.data = this.getSlickData(moduleValue).then(function(data) {
                    //that.slick.data = data;

                that.module.model.dataListenChange( that.module.data, function(event) {
                    var jpath = event.jpath;

                    if(jpath && jpath[0]) {
                        //var item = that.module.data[jpath[0]];
                        //that.updateSlickItem(that.module.data, j, item);
                        that.grid.invalidateRow(+jpath[0]);
                        that.grid.render();
                    }

                }, 'list');





                    that.grid = new Slick.Grid("#"+that._id, that.slick.data, that.slick.columns, that.slick.options);

                    that._activateHighlights();

                    that.grid.setSelectionModel(new Slick.CellSelectionModel());

                    that.grid.onAddNewRow.subscribe(function (e, args) {
                        var item = args.item;
                        //that.grid.invalidateRow(data.length);
                        //data.push(item);
                        //that.grid.updateRowCount();
                        //that.grid.render();
                    });

                    that.grid.onMouseEnter.subscribe(function(e) {
                        var cell = that.grid.getCellFromEvent(e);
                        var hl = that.module.data[cell.row]._highlight;
                        if(hl) {
                            API.highlightId(hl,1);
                            lastHighlight = hl;
                        }
                    });

                    that.grid.onMouseLeave.subscribe(function(e) {
                        var cell = that.grid.getCellFromEvent(e);
                        var hl = that.module.data[cell.row]._highlight;
                        if(hl) {
                            API.highlightId(hl,0);
                        }
                        else if(lastHighlight) {
                            API.highlightId(lastHighlight,0);
                        }
                    });

                    that.grid.onCellChange.subscribe(function(e, args) {
                        var row = args.row;
                        var cell = args.cell;
                        var jpath = that.colConfig[cell].jpath.slice();
                        jpath.unshift(row);
                        that.module.model.dataSetChild(that.module.data, jpath, that.module.data.getChildSync(jpath));
                    });

                    that.grid.onColumnsResized.subscribe(function(e, args) {
                        var cols = that.grid.getColumns();
                        for(var i=0; i<cols.length; i++) {
                            that.module.definition.configuration.groups.cols[0][i].width = cols[i].width;
                        }

                    });

                    that.grid.onColumnsReordered.subscribe(function(e, args) {
                        var cols = that.grid.getColumns();
                        var conf = that.module.definition.configuration.groups.cols[0];
                        var names = _.pluck(conf, 'name');
                        var ids = _.pluck(cols, 'id');

                        if(names.concat().sort().join() !== ids.concat().sort().join()) {
                            Debug.warn('Something might be wrong, number of columns in grid and in configuration do not match');
                            return;
                        }
                        that.module.definition.configuration.groups.cols[0] = [];
                        for(var i=0; i<cols.length; i++) {
                            var idx = names.indexOf(ids[i]);
                            if(idx > -1) {
                                that.module.definition.configuration.groups.cols[0].push(conf[idx]);
                            }
                        }
                    });
                //});


            }

        },

        _drawHighlight: function(key) {
            this.grid.setCellCssStyles(key, this.cellStyles[key]);
        },

        _undrawHighlight: function(key) {
            this.grid.removeCellCssStyles(key);
        },


        _activateHighlights: function() {
            var that = this;
            var hl = _(this.module.data).pluck('_highlight').uniq().value();
            var cols = this.grid.getColumns();
            var base = {};
            for(var i=0; i<cols.length; i++) {
                base[cols[i].id] = 'highlighted-cell';
            }

            console.log('base', base);
            var r = {};
            for(var j=0; j<this.module.data.length; j++) {
                var h= this.module.data[j]._highlight;
                if(!h) continue;
                if(!r[h]) r[h] = {};

                r[h][j.toString()] = base;
            }

            this.cellStyles = r;


            API.killHighlight(this.module.getId());

            for(i=0; i<hl.length; i++) {
                (function(i) {
                    API.listenHighlight({_highlight: hl[i]}, function(onOff, key) {
                        if(onOff) {
                            that._drawHighlight(key);
                        }
                        else {
                            that._undrawHighlight(key);
                        }
                    });
                })(i);
            }
        },

        onResize: function() {
            if(this.grid) {
                this.grid.resizeCanvas();
            }

        }



    });

    function waitingFormatter(value) {
        return "wait...";
    }

    function requiredFieldValidator(value) {
        if (value == null || value == undefined || !value.length) {
            return {valid: false, msg: "This is a required field"};
        } else {
            return {valid: true, msg: null};
        }
    }

    function typeRenderer(cellNode, row, dataContext, colDef) {
        var def = Renderer.toScreen(dataContext, null, null, colDef.jpath);
        console.log('type renderer');
        def.always(function(value) {
            $(cellNode).html(value);
        });
    }

    var lastHighlight = '';
    return View;

});