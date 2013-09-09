/**
 * jQuery plugin - Easy Zoom (modified)
 * 
 * @author Alen Grakalic
 * @author Matt Hinchliffe
 * @author Marvin Elia Hoppe
 * @license Creative Commons Attribution-ShareAlike 3.0
 * @version 1.0.4
 */
(function($) {	  
	
	function EasyZoom(target, settings){
		
		/**
		 * Wrapping the instance of this plugin
		 */
		var $this = this;

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
		this.notifications = {
				loading: "Loading high resolution image...",
				error: "There has been a problem with loading the image!"
		};
		
		/**
		 * Extend the default settings
		 */
		this.settings = $.extend(defaultSettings, settings);
		
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
			$this.reset().attachEventListener();
		};
		
		/**
		 * Attach serveral eventlistener to the given target
		 * 
		 * @returns EasyZoom
		 */
		this.attachEventListener = function() {			
			$(target).on({
				mouseover: function() {
					$this.start();					
				},
				mousemove: function(event) {
					$this.recognizeMouseMovement(event);					
				}
			});					
			return $this;
		};
		
		/**
		 * Detach serveral event listener otherwise events will be called multiple times
		 * 
		 * @returns EasyZoom
		 */
		this.detachEventListener = function() {
			$(target).off();
			return $this;
		};
		
		/**
		 * Start the jQuery plugin
		 * 
		 * @returns void
		 */
		this.start = function() {	
			
			$this.modifyCursorAppearance("auto");
			
			if(!global.resource.isLoaded){
				$this.modifyCursorAppearance("progress");
				$this.showNotification($this.notifications.loading);				
				$this.waitUntilResourceIsLoaded(global.resource.reference);				
			}	
			else{
				/**
				 * Show initial zoom window
				 */
				$this.showZoomWindow();
			}
		};
		
		/**
		 * Reset the jQuery plugin
		 * 
		 * @returns EasyZoom
		 */
		this.reset = function() {		
			global.resource.isLoaded = false;			
			return $this.fadeOut().detachEventListener();
		}
		
		/**
		 * Fadeout various elements which have been made visible before
		 * 
		 * @returns EasyZoom
		 */
		this.fadeOut = function() {
			$($this.settings.selector.window).fadeOut();	
			$($this.settings.selector.preview).fadeOut();
			return $this;
		};
		
		/**
		 * Defer fadeout by the given time in milliseconds
		 * 
		 * @param integer time
		 * @returns void
		 */
		this.deferredFadeOut = function(time) {
			setTimeout(function() {
				$this.fadeOut();
			}, time);			
		};
		
		/**
		 * Wait until the resource is loaded
		 * 
		 * @returns EasyZoom
		 */
		this.waitUntilResourceIsLoaded = function(reference) {
		
			global.resource.image.src = reference;
			
			$(global.resource.image).load(function() {
				global.resource.isLoaded = true;				
				$this.calculateRelationOfImageGeometry(this);

				/**
				 * Restart jQuery plugin
				 */
				$this.start();				
				}
			).error(function() {
				$this.showErrorNotification();
				}
			);		
			
			return $this;
		};
		
		/**
		 * Show the zoom window
		 * 
		 * @returns void 
		 */
		this.showZoomWindow = function() {
            $($this.settings.selector.window).html(global.resource.image).fadeIn();	            
		};
		
		/**
		 * Show the preview of the magnified area
		 * 
		 * @returns void
		 */
		this.showPreview = function(positionProperties) {				
			$($this.settings.selector.preview).css(positionProperties).fadeIn();				
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
				if($this.previewRemainsInScope(event)){
					
					var positionLeft = 
						((event.pageX - global.image.lowResolution.offset().left) * global.image.properties.relation.width) - 
						($($this.settings.selector.window).width() / 2);
					
					var positionTop = 
						((event.pageY - global.image.lowResolution.offset().top) * global.image.properties.relation.height) - 
						($($this.settings.selector.window).height() / 2);
						
					$($this.settings.selector.window).children("img:first").css({left: -positionLeft, top: -positionTop});	
	
					$this.showPreview($this.getPositionPropertiesPreview(event));
					$this.showZoomWindow();					
				}
				else{
					$this.fadeOut();
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
					height: $($this.settings.selector.window).height() / global.image.properties.relation.height,
					width: ($($this.settings.selector.window).width() / global.image.properties.relation.width)									
			}
			
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
		 * @returns EasyZoom
		 */
		this.showNotification = function(notification) {
			$($this.settings.selector.window).fadeIn().text(notification);
			return $this;
		};
		
		/**
		 * Shows an error notification, after two seconds the zoom window
		 * will be hidden
		 * 
		 * @returns vois
		 */
		this.showErrorNotification = function() {			
			$this.modifyCursorAppearance("auto").showNotification($this.notifications.error).deferredFadeOut(2000);	
		};
		
		/**
		 * Modify the cursor appearance when the target hover event will be
		 * triggered
		 * 
		 * @returns EasyZoom
		 */
		this.modifyCursorAppearance = function(appearance) {
			$(target).css("cursor", appearance);
			return $this;
		};
		
		/**
		 * Initialize the jQuery plugin at startup
		 * 
		 * @returns void
		 */
		$this.init();
	};

	/**
	 * jQuery plugin wrapper
	 */
	$.fn.easyZoom = function(settings) {
		
		return this.each(function(){
			$.data(this, "easyZoom", new EasyZoom(this, settings));
		});		
	};

})(jQuery);