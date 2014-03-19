define(['modules/default/defaultview', "src/util/util", "src/util/datatraversing", "lib/parallel-coordinates/d3.parcoords"], function(Default, Util, Traversing) {

    function view() {
        this._id = Util.getNextUniqueId();
        this._value = new DataArray();
        this._addedColumns = {};
    }
    ;

    Util.loadCss('lib/parallel-coordinates/d3.parcoords.css');

    view.prototype = $.extend(true, {}, Default, {
        init: function() {
            var html = '<div class="parcoords" id="'+this._id+'"></div>';

            this.dom = $(html).css({
                height: '100%',
                width: '100%'
            });

            this.module.getDomContent( ).html(this.dom);
            this.onReady = $.Deferred();
        },
        blank: {
            value: function() {
                this.dom.empty();
            }
        },
        update: {
            value : function(value) {
                if(!value)
                    return;
                value = value.get();
                if(!value instanceof Array)
                    return;
                
                this._value = value;
                
                this.redrawChart();
            }
        },
        onActionReceive: {
            addColumn: function(value) {
                this._addedColumns[value.name] = value;
                this.redrawChart();
            },
            removeColumn: function(value) {
                delete this._addedColumns[value.name];
                this.redrawChart();
            }
        },
        onResize: function() {
            this.onReady.resolve();
            this.redrawChart();
        },
        redrawChart: function() {
            var that=this;
            this.createIntermediateData();
            this.dom.empty();
            
            var parcoords = d3.parcoords()("#"+(this._id));
                parcoords.data(this._data);
                parcoords.detectDimensions();
                if(this._names)
                    parcoords.dimensions(this._names);
                
                parcoords.render()
                        .brushable()
                        .reorderable();
                parcoords.on("brush", function(d){
                    that.module.controller.onBrushSelection(d);
                });
                
            this.module.controller.onBrushSelection(this._data);
        },
        createIntermediateData: function() {
            var totalConfig = [];
            var config = this.module.getConfiguration("colsjPaths");
            if(config) {
                for(var i = 0; i < config.length; i++){
                    totalConfig.push(config[i]);
                }
            }
            if(this._addedColumns) {
                for(var i in this._addedColumns){
                    totalConfig.push(this._addedColumns[i]);
                }
            }
            
            var value = this._value;
            
            if(!totalConfig.length)
               return this._data = value;
            
            var newValue = new DataArray();
            var names = [];
            for(var i = 0; i < totalConfig.length; i++){
                names[i] = totalConfig[i].name;
            }
            this._names = names;
            
            for(var i = 0; i < value.length; i++) {
                var val = new DataObject();
                newValue[i] = val;
                for(var j = 0; j < totalConfig.length; j++) {
                    Traversing.getValueFromJPath(value[i],totalConfig[j].jpath).always(function(result){
                        val[totalConfig[j].name] = result;
                    });
                    val.__id = i;
                }
            }
            
            this._data = newValue;
        }
      
    });
    
    return view;
});