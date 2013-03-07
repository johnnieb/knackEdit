define( function () {
		
	function makeCounter(prefix) {
		var c=0, result;
		prefix=prefix || "";
		result=function() {return c};
		result.next=function(){c++; return prefix+c;};
		return result;
	}


	function getSelection() {
		var selection= (window.getSelection) ? window.getSelection() : document.selection;
		if (!selection) {
			return undefined;
		}
		return selection.rangeCount ? selection.getRangeAt(0) : undefined;
	}

	function markSelection() {
		var r=getSelection();
		r.insertNode(selectionEnd);
		r.insertNode(selectionStart);
		r.setStartAfter(selectionStart);
		r.setEndBefore(selectionEnd);
	}
	
	function select(range) {
		var selection=window.getSelection();
		if(getSelection) {
			selection.removeAllRanges();
			selection.addRange(range);
		} else {
			range.select();
		}
	}

	function StRange(range, root) {
		
		this.start=getPosition(range.startContainer, range.startNode);
		this.end=getPosition(range.endContainer, range.endNode, true);
		this.root=root;
		
		return this;
		
		function getPosition(node, offset, fromEnd) {
			var result=[offset];
			while (node != root) {
				offset.push(getOffset(node, parent, fromEnd));
				node=node.parentNode;
			}
		
			function getOffset(node, fromEnd, sibProperty) {
				var result=0, sibProperty=fromEnd ? "nextSibling" : "previousSibling";
				while (node=node[sibProperty]) {
					result++;
				}
				return result;
			}
		}
	}
	
	StRange.prototype = {
		toRange : function() {
			var result=document.createRange();
			offset=this.start[0];
			result.startOffset=this.start[0];
			result.startContainer=nodeFromPosition(this.start);
			result.endContainer=nodeFromPosition(this.end);
			result.endOffset=result.endContainer.childNodes ? result.endContainer.childNodes.length -this.end[0] - 1 :  result.endContainer.length -this.end[0] -1 ;
			return result;
			
			function nodeFromPosition(position) {
				var i=1,result=root;
				for (;i<position.length; i++) {
					result=result.childNodes[position[i]];
				}
				return result;
			}
		},
		select : function() {
			select(this.toRange());
		}
	};
		
	var selectionStart=document.createComment("com.the-knack.util/selStart");
	var selectionEnd=document.createComment("com.the-knack.util/selEnd");
	
	return {
		makeCounter:makeCounter,
		StRange:StRange,
		getSelection:getSelection,
		select:select
	};
});