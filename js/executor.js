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

define(['jquery'], function ($) {
	
	var	executor={}, undos=[], redos=[], 
		NO_UNDO_MESSAGE="Nothing to Undo",
		NO_REDO_MESSAGE="Nothing to Redo",
		DEFAULT_ACTION_LABEL="last action",
		MAX_UNDO_DEPTH=NaN;
	
	/*
		Each event in the undo/redo stacks is stored as an Action object.
	*/
	function Action(fn, ufn, label, cleanUpFn) {
		this.redo=fn;
		this.label=label ||  DEFAULT_ACTION_LABEL;
		this.undo=ufn;
		this.cleanUp=cleanUpFn || cleanUp;
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
		the desired document change. label is optional. The clean up function (cleanUpFn) is run when an action
		is invalidated. It is optional.
	*/
	executor.exec=function(fn, ufn, label, cleanUpFn) {
		if (typeof fn !== "function" || typeof ufn !== "function") {
			throw new Error("Executor: Exec - Invalid do or undo function");
		}
		var action=new Action(fn, ufn, label, cleanUpFn || cleanUp);
		undos.unshift(action);
		executor.clear("redo");
		if (undos.length > MAX_UNDO_DEPTH) {
			undos.pop().cleanUp();
		}
		return fn();
	}

	//	A dummy cleanUp function to be used as default;
	function cleanUp(){};

	/*
		To avoid too many undo steps (such as one per character typed), update can be called, instead of
		exec. This will replace the most recent action in the undo stack with a new action. If a touchup function (tfn)
		is provided, it will be executed instead of the regular function (fn) that ends up in the undo/redo stacks.
	*/
	executor.update=function (fn, touchupFn) {
		var action, existing=undos.shift();
		if (!existing) {
			throw new Error("Executor: Update - No action to update");
		}
		action=new Action(fn, existing.undo, existing.label);
		undos.unshift(action);
		fn=(typeof touchupFn ==="function") ? touchupFn : fn;
		return  fn();
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
				action.cleanUp();
			}
		}
		if (which=="redo" || which=="both") {
			while (action=redos.shift()) {
				action.cleanUp();
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