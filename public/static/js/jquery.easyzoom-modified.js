/**
 * jQuery plugin - Easy Zoom (modified)
 * 
 * @author Alen Grakalic
 * @author Matt Hinchliffe
 * @author Marvin Elia Hoppe
 * @license Creative Commons Attribution-ShareAlike 3.0
 * @version 1.0.6
 */
(function($) {	  
	
	$.easyZoom = function(target, settings) {
		
		/**
		 * Wrapping the instance of this plugin
		 */
		var plugin = this;

		/**
		 * Define default settings
		 */
		var defaultSettings = {
				selector: {
					preview: "#preview-zoom",
					window: "#window-zoom"					
				}
		};
		
		/**
		 * Define notifications
		 */
		plugin.notifications = {
				loading: "Loading high resolution image...",
				error: "There has been a problem with loading the image!"
		};
		
		/**
		 * Extend the default settings
		 */
		plugin.settings = $.extend(defaultSettings, settings);
		
		/**
		 * Define global attributes
		 */
		var global = {				
				image: {
					lowResolution: $("img:first", target),
					properties: {
						relation: {
							height: null,
							width: null							
						}						
					}					
				},
				resource: {
					image: new Image(),
					isLoaded: false,					
					reference: null					
				}				
		};

		/**
		 * Initialize the jQuery plugin
		 * 
		 * @returns void
		 */
		this.init = function(referenceOfImage) {			
			global.resource.reference = (typeof referenceOfImage != "undefined") ? referenceOfImage : $(target).attr("data-image");
			plugin.reset().attachEventListener();
		};
		
		/**
		 * Attach serveral eventlistener to the given target
		 * 
		 * @returns easyZoom 
		 */
		this.attachEventListener = function() {			
			$(target).on({
				mouseover: function() {
					plugin.start();					
				},
				mousemove: function(event) {
					plugin.recognizeMouseMovement(event);					
				},
				mouseout: function(event) {					
					if(!plugin.previewRemainsInScope(event)){
						plugin.fadeOut();						
					}					
				}
			});					
			return plugin;
		};
		
		/**
		 * Detach serveral event listener otherwise events will be called multiple times
		 * 
		 * @returns easyZoom
		 */
		this.detachEventListener = function() {
			$(target).off();
			return plugin;
		};
		
		/**
		 * Start the jQuery plugin
		 * 
		 * @returns void
		 */
		this.start = function() {	
			
			plugin.modifyCursorAppearance("auto");
			
			if(!global.resource.isLoaded){
				plugin.modifyCursorAppearance("progress");
				plugin.showNotification(plugin.notifications.loading);				
				plugin.waitUntilResourceIsLoaded(global.resource.reference);				
			}	
			else{
				/**
				 * Show initial zoom window
				 */
				plugin.showZoomWindow();
			}
		};
		
		/**
		 * Reset the jQuery plugin
		 * 
		 * @returns easyZoom
		 */
		this.reset = function() {		
			global.resource.isLoaded = false;			
			return plugin.fadeOut().detachEventListener();
		};
		
		/**
		 * Fadeout various elements which have been made visible before
		 * 
		 * @returns easyZoom
		 */
		this.fadeOut = function() {
			$(plugin.settings.selector.window).fadeOut();	
			$(plugin.settings.selector.preview).fadeOut();
			return plugin;
		};
		
		/**
		 * Defer fadeout by the given time in milliseconds
		 * 
		 * @param integer time
		 * @returns void
		 */
		this.deferredFadeOut = function(time) {
			setTimeout(function() {
				plugin.fadeOut();
			}, time);			
		};
		
		/**
		 * Wait until the resource is loaded
		 * 
		 * @returns Global
		 */
		this.waitUntilResourceIsLoaded = function(reference) {
		
			global.resource.image.src = reference;
			
			$(global.resource.image).load(function() {
				global.resource.isLoaded = true;				
				plugin.calculateRelationOfImageGeometry(this);

				/**
				 * Restart jQuery plugin
				 */
				plugin.start();				
				}
			).error(function() {
				plugin.showErrorNotification();
				}
			);		
			
			return plugin;
		};
		
		/**
		 * Show the zoom window
		 * 
		 * @returns void 
		 */
		this.showZoomWindow = function() {
            $(plugin.settings.selector.window).html(global.resource.image).fadeIn();	            
		};
		
		/**
		 * Show the preview of the magnified area
		 * 
		 * @returns void
		 */
		this.showPreview = function(positionProperties) {				
			$(plugin.settings.selector.preview).css(positionProperties).fadeIn();				
		};
		
		/**
		 * Calculate relations of image geometry
		 * 
		 * @returns void
		 */
		this.calculateRelationOfImageGeometry = function(imageHighResolution) {						

			global.image.properties.relation.width =
				imageHighResolution.width / global.image.lowResolution.width();
			
			global.image.properties.relation.height =
				imageHighResolution.height / global.image.lowResolution.height();		
		};
		
		/**
		 * Recognize mouse movement, animate image inside the zoom window
		 * 
		 * @param object event
		 * @returns void
		 */
		this.recognizeMouseMovement = function(event) {
			
			if(global.resource.isLoaded){
				if(plugin.previewRemainsInScope(event)){
					
					var positionLeft = 
						((event.pageX - global.image.lowResolution.offset().left) * global.image.properties.relation.width) - 
						($(plugin.settings.selector.window).width() / 2);
					
					var positionTop = 
						((event.pageY - global.image.lowResolution.offset().top) * global.image.properties.relation.height) - 
						($(plugin.settings.selector.window).height() / 2);
						
					$(plugin.settings.selector.window).children("img:first").css({left: -positionLeft, top: -positionTop});	
	
					plugin.showPreview(plugin.getPositionPropertiesPreview(event));
					plugin.showZoomWindow();					
				}
				else{
					plugin.fadeOut();
				}					
			}			
		};
		
		/**
		 * Retrieve a list of position properties used to adjust the preview
		 * 
		 * @param object event
		 * @returns multitype:integer
		 */
		this.getPositionPropertiesPreview = function(event) {
			
			var positionProperties = {
					height: $(plugin.settings.selector.window).height() / global.image.properties.relation.height,
					width: ($(plugin.settings.selector.window).width() / global.image.properties.relation.width)									
			};
			
			var offsetParent = $(global.image.lowResolution).offsetParent().offset();
		
			return $.extend(positionProperties, {
				left: event.pageX - (positionProperties.width / 2) - offsetParent.left,
				top: event.pageY - (positionProperties.height / 2) - offsetParent.top
				});
		};	
		
		/**
		 * Review wether the preview remains in a valid scope
		 * 
		 * @param object event
		 * @returns boolean
		 */
		this.previewRemainsInScope = function(event) {
			
			var area = $(global.image.lowResolution);
			
			if(event.pageX < area.offset().left){
				return false;
			}
			if(event.pageX > area.offset().left + area.width()){
				return false;				
			}
			if(event.pageY < area.offset().top){
				return false;
			}
			if(event.pageY > area.offset().top + area.height()){
				return false;				
			}
			
			return true;
		};

		/**
		 * Shows the given notification in the zoom window
		 * 
		 * @returns easyZoom
		 */
		this.showNotification = function(notification) {
			$(plugin.settings.selector.window).fadeIn().text(notification);
			return plugin;
		};
		
		/**
		 * Shows an error notification, after two seconds the zoom window
		 * will be hidden
		 * 
		 * @returns void
		 */
		this.showErrorNotification = function() {			
			plugin.modifyCursorAppearance("auto").showNotification(plugin.notifications.error).deferredFadeOut(2000);	
		};
		
		/**
		 * Modify the cursor appearance when a hover event of the target will be
		 * triggered
		 * 
		 * @returns easyZoom
		 */
		this.modifyCursorAppearance = function(appearance) {
			$(target).css("cursor", appearance);
			return plugin;
		};
		
		/**
		 * Initialize the jQuery plugin at startup
		 * 
		 * @returns void
		 */
		plugin.init();		
	};

	/**
	 * jQuery plugin wrapper
	 */
	$.fn.easyZoom = function(settings) {
		
		return this.each(function(){
			$.data(this, "easyZoom", new $.easyZoom(this, settings));
		});		
	};

})(jQuery);