define(['edit','jquery'], function (editor,$) {
	//Define the module value by returning a value.
	console.log($);
	
	$(".kneditable").each(
    		function() {
    			editor.makeEditable(this);
    		}
    	)
    
});