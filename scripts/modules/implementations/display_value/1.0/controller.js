 /*
 * controller.js
 * version: dev
 *
 * Copyright 2012 Norman Pellet - norman.pellet@epfl.ch
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

if(typeof CI.Module.prototype._types.display_value == 'undefined')
	CI.Module.prototype._types.display_value = {};

CI.Module.prototype._types.display_value.Controller = function(module) {}

$.extend(CI.Module.prototype._types.display_value.Controller.prototype, CI.Module.prototype._impl.controller, {
	
	configurationSend: {

		events: {
			
		},
		
		rels: {
			
		}
		
	},
	
	
	configurationReceive: {
		"value": {
			type: ['string', 'number', 'mf', 'picture', 'gif', 'jpeg', 'png', 'mol2d'],
			label: 'Any string, number or picture',
			description: ''
		},
		
		"color": {
			type: "string",
			label: "A color to fill the module with"
		}
	},
	
	
	moduleInformations: {
		moduleName: 'Single value'
	},
	
	doConfiguration: function(section) {
		
		var groupfield = new BI.Forms.GroupFields.List('module');
		section.addFieldGroup(groupfield);
		
		var field = groupfield.addField({
			type: 'Wysiwyg',
			name: 'defaultvalue'
		});
		field.setTitle(new BI.Title('Default value'));
		
		
		
		var field = groupfield.addField({
			type: 'Color',
			name: 'fcolor'
		});
		field.setTitle(new BI.Title('Foreground color'));
		
		/*
		var field = groupfield.addField({
			type: 'Color',
			name: 'bcolor'
		});
		field.setTitle(new BI.Title('Default background color'));
		*/
		
		var field = groupfield.addField({
			type: 'Combo',
			name: 'font'
		});
		field.setTitle(new BI.Title('Font'));
		field.implementation.setOptions([
			{title: 'Arial', key: 'arial'},
			{title: 'Arial Black', key: 'arial black'},
			{title: 'Comic Sans MS', key: 'comic sans ms'},
			{title: 'Courier', key: 'courier'},
			{title: 'Courier new', key: 'courier new'},
			{title: 'Georgia', key: 'georgia'},
			{title: 'Helvetica', key: 'helvetica'},
			{title: 'Impact', key: 'impact'},
			{title: 'Palatino', key: 'palatino'},
			{title: 'Times new roman', key: 'times new roman'},
			{title: 'Trebuchet MS', key: 'trebuchet ms'},
			{title: 'Verdana', key: 'verdana'}
		]);
		
		
		var field = groupfield.addField({
			type: 'Combo',
			name: 'fsize'
		});
		field.setTitle(new BI.Title('Font size'));
		field.implementation.setOptions([
			{title: '8pt', key: '8pt'},
			{title: '9pt', key: '9pt'},
			{title: '10pt', key: '10pt'},
			{title: '11pt', key: '11pt'},
			{title: '12pt', key: '12pt'},
			{title: '13pt', key: '13pt'},
			{title: '14pt', key: '14pt'},
			{title: '18pt', key: '18pt'},
			{title: '24pt', key: '24pt'},
			{title: '30pt', key: '30pt'},
			{title: '36pt', key: '36pt'},
			{title: '48pt', key: '48pt'},
			{title: '64pt', key: '64pt'}
		]);
		
		
		var field = groupfield.addField({
			type: 'Combo',
			name: 'align'
		});
		field.setTitle(new BI.Title('Align'));
		field.implementation.setOptions([
			{title: 'Left', key: 'left'},
			{title: 'Center', key: 'center'},
			{title: 'Right', key: 'right'}
		]);

		var field = groupfield.addField({
			type: 'Combo',
			name: 'valign'
		});
		field.setTitle(new BI.Title('Vertical align'));
		field.implementation.setOptions([
			{title: 'Top', key: 'top'},
			{title: 'Middle', key: 'middle'},
			{title: 'Bottom', key: 'bottom'}
		]);

		
		var field = groupfield.addField({
			type: 'Text',
			name: 'sprintf'
		});
		field.setTitle(new BI.Title('Sprintf'));
		
		
		return true;
	},
	
	doFillConfiguration: function() {
		
		var defaultvalue = this.module.getConfiguration().defaultvalue || "";
		var fcolor = this.module.getConfiguration().frontcolor || "";
	//	var bcolor = this.module.getConfiguration().backcolor || "";
		var font = this.module.getConfiguration().font || "arial";
		var fontsize = this.module.getConfiguration().fontsize || "";
		var align = this.module.getConfiguration().align || "left";
		var valign = this.module.getConfiguration().valign || "top";
		var sprintf = this.module.getConfiguration().sprintf || "";
	
		return {
			groups: {
				module: [{
					defaultvalue: [defaultvalue],
					fcolor: [fcolor],
				//	bcolor: [bcolor],
					font: [font],
					fsize: [fontsize],
					align: [align],
					valign: [valign],
					sprintf: [sprintf]
				}]
			}
		}
	},
	
	
	doSaveConfiguration: function(confSection) {
	
		var group = confSection[0].module[0];
		
		var fcolor = group.fcolor[0];
	//	var bcolor = group.bcolor[0];
		var font = group.font[0];
		var fsize = group.fsize[0];
		var align = group.align[0];
		var sprintf = group.sprintf[0];
		var valign = group.valign[0];
		var defaultvalue = group.defaultvalue[0];
		console.log(defaultvalue);
		this.module.definition.configuration = {
			frontcolor: fcolor,
		//	backcolor: bcolor,
			font: font,
			fontsize: fsize,
			align: align,
			valign: valign,
			defaultvalue: defaultvalue,
			sprintf: sprintf
		};
	}
});