define(['edit','jquery'], function (editor,$) {
	//Define the module value by returning a value.
	
	$(".kneditable").each(
    		function() {
    			editor.makeEditable(this);
    		}
    	)
    
});