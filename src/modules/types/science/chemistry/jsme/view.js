'use strict';

define(['require', 'modules/default/defaultview', 'src/util/api', 'src/util/ui'], function (require, Default, API, ui) {

    function View() {
    }

    var views = {};

    window.addEventListener('message', function (event) {

        try {
            var message = JSON.parse(event.data);
        } catch (e) {
            return;
        }
        if (message.module !== 'jsme') {
            return;
        }
        var id = message.id;
        if (!views[id]) {
            console.error('No view with ID ' + id);
            return;
        }
        var view = views[id];
        switch (message.type) {
            case 'ready':
                view.resolveReady();
                break;
            case 'onChange':
                view.module.controller.onChange(message.message.mol, message.message.molV3, message.message.smiles, message.message.jme, message.message.action);
                break;
            case 'doHighlight':
                view._doHighlight(message.message.mol, message.message.atom);
                break;
            default:
                console.error('Message type not handled: ', message.type);
                break;
        }
    });

    $.extend(true, View.prototype, Default, {

        init: function () {
            var that = this;

            var id = this.module.getId();
            views[id] = this;

            this.dom = ui.getSafeElement('iframe').attr('src', require.toUrl('./lib/jsme.html'));

            this.module.getDomContent().html(this.dom);
            this.module.getDomContent().css('overflow', 'hidden');

            this.dom.bind('load', function () {
                that.postMessage('init', {
                    prefs: that.getPrefs(),
                    highlightColor: that.getHighlightColor(),
                    bondwidth: that.module.getConfiguration('bondwidth'),
                    labelsize: that.module.getConfiguration('labelsize'),
                    id: id
                });
            });

        },

        getPrefs: function () {
            return this.module.getConfiguration('prefs').join();
        },

        getHighlightColor: function () {
            return this.module.getConfiguration('highlightColor', '3');
        },

        onResize: function () {
            this.dom.attr('width', this.width);
            this.dom.attr('height', this.height);

            this.postMessage('setSize', {
                width: this.width,
                height: this.height
            });

            this.refresh();
        },

        onProgress: function () {
            this.dom.html('Progress. Please wait...');
        },

        blank: {
            mol: function () {
                this.postMessage('clear', '*');
            },
            jme: function () {
                this.postMessage('clear', '*');
            },
            smiles: function () {
                this.postMessage('clear', '*');
            }
        },

        update: {
            mol: function (moduleValue) {
                this._currentValue = moduleValue;
                this._currentType = 'mol';
                if (!moduleValue.get()) return;

                this.postMessage('setMolFile', moduleValue.get());
                this._initHighlight(moduleValue);
            },
            jme: function (moduleValue) {
                this._currentValue = moduleValue;
                this._currentType = 'jme';
                if (!moduleValue.get()) return;

                this.postMessage('setJmeFile', moduleValue.get());
                this._initHighlight(moduleValue);
            },
            smiles: function (moduleValue) {
                var that = this;
                require(['openchemlib/openchemlib-core'], function (OCL) {
                    var smiles = String(moduleValue.get());
                    var mol = OCL.Molecule.fromSmiles(smiles);
                    that.postMessage('setMolFile', mol.toMolfile());
                    that._initHighlight(moduleValue);
                });
            }
        },

        _initHighlight: function (moduleValue) {
            var that = this;
            API.killHighlight(this.module.getId());
            API.listenHighlight(moduleValue, function (onOff, highlightId) {
                var atoms = [];
                for (var i = 0, l = highlightId.length; i < l; i++) {
                    if (!(moduleValue._atoms[highlightId[i]] instanceof Array))
                        moduleValue._atoms[highlightId[i]] = [moduleValue._atoms[highlightId[i]]];
                    atoms = atoms.concat(moduleValue._atoms[highlightId[i]]);
                }
                that.postMessage('setHighlight', {atoms: atoms, onOff: onOff});

            }, false, this.module.getId());
        },

        _doHighlight: function (mol, id) {
            if (!this._currentValue) return;

            // there is a problem with overlapping atoms, there is no event out
            // we therefore systematically unhighlight
            for (var i in this._currentValue._atoms) {
                if (this._currentValue._atoms[i].indexOf(this.highlightedAtom) > -1) {
                    API.highlightId(i, false);
                }
            }

            for (var i in this._currentValue._atoms) {
                if (id != 0) {
                    if (this._currentValue._atoms[i].indexOf(id - 1) > -1) {
                        API.highlightId(i, 1);
                    }
                }

            }

            this.highlightedAtom = id - 1;
        },

        postMessage: function (type, message) {
            var cw = this.dom.get(0).contentWindow;
            if (cw) {
                cw.postMessage(JSON.stringify({
                    type: type,
                    message: message
                }), '*');
            }
        },

        remove: function (id) {
            delete views[id];
        }

    });

    return View;

});
