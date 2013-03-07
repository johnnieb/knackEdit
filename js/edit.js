define(["executor","jquery", "lib/diff", "lib/util"], function (exec,$,diff,u) {
		
	var knackEditorId=u.makeCounter();


	function KnackEditor(elem, options) { 
		var 	openAction,								//the open action, if any
			knid=u.makeCounter("knid-"+knackEditorId.next()+"-"),  //produces uids
			ignoreKeyup,									//Set to ignore the keyup event.
			typing=false;								//are we in the middle of typing event?
	
		function configure(options) {
		
		}

		function getSelection() {
			var selection= (window.getSelection) ? window.getSelection() : document.selection;
			if (!selection) {
				return undefined;
			}
			return selection.rangeCount ? selection.getRangeAt(0) : undefined;
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

		function updateSelection() {
			setTimeout(reallyUpdateSelection,0);
			function reallyUpdateSelection() {
				
			}
		}
	
		function startAction(name) {
			//note: need to make sure selection is entirely in the editable area.
			var 	r=getSelection(), kn=knid.next(),
				start=makeMarker(kn,"start"), end=makeMarker(kn,"end"),
				action={id: kn, name:name},
				regExp,
				contents,
				context=r.commonAncestorContainer;
			r.insertNode(start);
			r.collapse();
			r.insertNode(end);
			r.setStartAfter(start);
			r.setEndBefore(end);
			start="<!--"+start.nodeValue+"-->";
			end="<!--"+end.nodeValue+"-->";
			select(r);
			context=context.nodeType==1 ? $(context) : $(context.parentNode);
			regExp=new RegExp(start+"(.*)"+end);
			
			action.val=function(arg) {
				var content, m1,m2;
				if (arg !==undefined) {
					content=context.html();
					content=content.replace(regExp,start+arg+end);
					context.html(content);
					m1=findMarker(kn+"-start", context);
					m2=findMarker(kn+"-end", context);
					if (start) {
						r.setStartAfter(m1);
					}
					if (end) {
						r.setStartBefore(m2);
					}
					select(r);
					return arg;
				} else {
					content=context.html().match(r);
					return content.length && content[0];
				}
			}
			contents=action.val();
			action.undo =function() {
				action.val(contents);
			}
			return action;
			
		}
		
		function findMarker(val,context) {
			context=$(context).get(0);
			var result;
			var iterator=document.createNodeIterator(context,NodeFilter.SHOW_COMMENT);
			while (result=iterator.nextNode()) {
				if (result.nodeValue==val) {
					return result;
				}
			}
			return false;
		}

		function makeMarker(knid,which) {
/*			var result=document.createElement("script");
			result.setAttribute("type", "knack/marker-"+which);
			result.setAttribute("id",knid+"-"+which);
			return result; */
			return document.createComment(knid+"-"+which);
		}

		function handleKeydown(e) {
			window.e=e;
			console.log("Keydown is",e);
			key=  e.which;
			if (key < 41 && key > 36) {
				openAction=false;
				updateSelection();
				return;
			}
			key=String.fromCharCode(key);
			if (e.altKey) {
				e.preventDefault();	
				e.stopPropagation();
			}
			if (!e.ctrlKey && !e.metaKey) {
				ignoreKeyup=false;
				e.stopPropagation();
				
			} else {
				openAction=false;
				ignoreKeyup=true;
			}
			key=key.toLowerCase();
			window.changed=true;

			if (key > 100 || key < 32){return};
			if (e.shiftKey) {
				key="shift+"+key;
			}
			if (actions[key]) {
				actions[key]();
				updateSelection();
				e.preventDefault();	
				e.stopPropagation();
			}
		}
		
		function handleKeypress(e) {
			if (ignoreKeyup) {
				ignoreKeyup = false;
			} else {
				console.log("Keypress is",e);
				type(String.fromCharCode(e.keyCode));
			}
			e.preventDefault();	
			e.stopPropagation();
		}
		
		function handleKeyup(e) {
			console.log("Keyup is",e);
		}
		
		
		function handleClick(e) {
			updateSelection();
			openAction=false;
		}
		
		function type(char) {
			var action;
			if (openAction && openAction.name =="typing") {
				
				action=openAction;
				action.soFar+=char;
				exec.update(function(){action.val(action.soFar)});
			} else {
				action=startAction("typing");
				action.soFar=char;
				exec.exec(function(){action.val(char)}, "typing",  elem);
				openAction=action;
			}
			return;
		}
		
		function returnKey() {
		
		}
		
		function KnackRange(range, root) {
			
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
		
		$.extend(KnackRange.prototype, {
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
		});
		
		
		function update() {
			
		}
		
		var actions={
			"z" :  exec.undo,
			"shift+z" : exec.redo,
			"return" :  returnKey
		}
		
		this.configure=configure;
		
		$(elem).bind("input", function(e){console.log("Input event: ")});
		$(elem).keydown(handleKeydown);
		$(elem).keypress(handleKeypress);
		$(elem).keyup(handleKeyup);
		$(elem).mouseup(handleClick);
		configure(options);
		
		
		
		
	}

	function makeEditable(elem, options) {

		
		//Test diff speed
		var 	t1=$("#someText").html(),
			t2=$("#someMoreText").html();
		var s=new Date().valueOf();
		for (var i=0; i<=100; i++) { 
			var undoPatch= diff.patch_make(t2,t1);
			var result=diff.patch_apply(undoPatch,t2)[0];
		}
		console.log(undoPatch);
		window.result=undoPatch;
		console.log(" and was "+((result==t1) ? "" : "un" )+"successful");
		

		return new KnackEditor(elem, options);

	}
	
	return {
		makeEditable: makeEditable,
	};
});
