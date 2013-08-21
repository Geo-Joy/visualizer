define(['modules/defaultcontroller', 'util/datatraversing'], function(Default, Traversing) {


	function controller() {

	};

	controller.prototype = $.extend(true, {}, Default, {


		configurationSend: {

			events: {
				
			},
			
			rels: {
				
			}
			
		},
		
		configurationReceive: {
			jcampx: {
				type: ["jcamp"],
				label: 'Top axis'
			},

			jcampy: {
				type: ["jcamp"],
				label: 'Left data'
			},

			jcampxy: {
				type: ["jcamp"],
				label: 'Left and top axis'
			},

			jcamp2d: {
				type: ["jcamp"],
				label: '2D Jcamp'
			}		
		},
		
		actions: {
			//rel: {'addSerie': 'Add a serie', 'removeSerie': 'Remove a serie'}
		},


		actionsReceive: {
			
		},


		moduleInformations: {
			
		},
		
		doConfiguration: function(section) {

			return true;
		},
		
		doFillConfiguration: function() {


		},
			
		doSaveConfiguration: function(confSection) {	

		}
	});

	return controller;
});
