/*
 * executor.js ©2013 Ballard Blevins
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.

*/

define(['jquery', "lib/diff"], function ($, diff) {
	
	var	executor={}, undos=[], redos=[], 
		NO_UNDO_MESSAGE="Nothing to Undo",
		NO_REDO_MESSAGE="Nothing to Redo",
		DEFAULT_ACTION_LABEL="last action",
		MAX_UNDO_DEPTH=NaN;
	
	/*
		Each event in the undo/redo stacks is stored as an Action object.
	*/
	function Action(doDiff, undoDiff, label, context) {
		console.log(doDiff,undoDiff);
		var html=context.html();
		this.redo=function() {
			var result=diff.patch_apply(doDiff,html);
			context.html(result);
		}
		this.undo=function() {
			var result=diff.patch_apply(undoDiff, html);
			context.html(result);
		}
		this.close=function() {
			html=undefined;
		}
		this.getHtml=function(fn) {
			return html;
		}
		this.context=context;
		this.label=label ||  DEFAULT_ACTION_LABEL;
	}

	//change configuration 
	function configure(obj) {
		NO_UNDO_MESSAGE=NO_UNDO_MESSAGE || NO_UNDO_MESSAGE;
		NO_REDO_MESSAGE=obj.NO_REDO_MESSAGE|| NO_REDO_MESSAGE;
		DEFAULT_ACTION_LABEL=obj.DEFAULT_ACTION_LABEL || DEFAULT_ACTION_LABEL;
		MAX_UNDO_DEPTH=obj.MAX_UNDO_DEPTH || MAX_UNDO_DEPTH;
	}
	
	//provide a useful string representation for tool tips/menu labels
	$.extend(Action.prototype, {
		toString: function () {return this.label}
	});

	/*
		called when modifying the document. fn and ufn are the functions to , respectively, make and revert 
		the desired document change. label is optional. 
	*/
	executor.exec=function(fn, label, context) {
		context=$(context);
		if (typeof fn !== "function" ) {
			throw new Error("Executor: Exec - Invalid function");
		}
		
		undos[0] && undos[0].close();
		var oldState=context.html(), doDiff, undoDiff, newState, action;
		fn(context);
		newState=context.html();
		doDiff=diff.patch_make(newState,oldState);
		undoDiff=diff.patch_make(oldState,newState);
		action=new Action(doDiff, undoDiff, label, context);
		undos.unshift(action);
		executor.clear("redo");
		if (undos.length > MAX_UNDO_DEPTH) {
			undos.pop()
		}
	}

	/*
		To avoid too many undo steps (such as one per character typed), update can be called, instead of
		exec. This will replace the most recent action in the undo stack with a new action. If a touchup function (tfn)
		is provided, it will be executed instead of the regular function (fn) that ends up in the undo/redo stacks.
	*/
	executor.update=function (fn) {
		var action, existing=undos.shift(), newState, oldState, doDiff, undoDiff;
		if (!existing) {
			throw new Error("Executor: Update - No action to update");
		}
		oldState=existing.getHtml();
		if (oldState===undefined) {
			throw new Error("Executor: Update - Latest undo is closed");
		}
		fn(existing.context);
		newState=existing.context.html();
		doDiff=diff.patch_make(newState,oldState);
		undoDiff=diff.patch_make(oldState,newState);
		action=new Action(doDiff,undoDiff, existing.label, existing.context);
		undos.unshift(action);
	}

	/*
		undo shifts the bottom item off the undo stack (undos) and unshifts it into the redo stack (redos),
		then executes it.
	*/	
	executor.undo=function() {
		var action=undos.shift();
		if(action) {
			redos.unshift(action);
			action.undo();
			return true;
		}
		return false;
	}

	//	a meaningful string representation, for labels and such
	executor.undo.toString=function() {
		return undos[0] ? "Undo " + undos[0] : NO_UNDO_MESSAGE;
	}

	/*
		redo shifts the bottom item off theredo stack (redos) and unshifts it into the undo stack (undos),
		then executes it.
	*/	
	executor.redo=function() {
		var action=redos.shift();
		if(action) {
			undos.unshift(action);
			action.redo();
			return true;
		}
		return false;
	}

	//	a meaningful string representation, for labels and such
	executor.redo.toString=function() {
		return redos[0] ? "Redo " + redos[0] : NO_REDO_MESSAGE;
	}

	// 	clear all pending actions
	executor.clear=function(which) {
		var action;
		if (which=="undo" || which=="both") {
			while (action=undos.shift()) {
			}
		}
		if (which=="redo" || which=="both") {
			while (action=redos.shift()) {
			}
		}
	}

	//	report size of undo/redo stacks
	executor.status=function() {
		return {undos: undos.length, redos:redos.length};
	}

	//	return the executor object
	return executor;
});