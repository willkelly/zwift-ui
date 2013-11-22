/**
 * User: Alexander
 * Date: 05.11.13
 * Time: 15:39
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var slashAtEndRegex = /\/$/,
		uploads,
		disableAllClass = "freeze-all",
		buttonsPointerClass = "progressbar-buttons",
		requests = [];

	function enableButtons(){
		document.body.classList.remove(disableAllClass);
		document.body.classList.remove(buttonsPointerClass);
	}

	function disableButtons(){
		document.body.classList.remove(disableAllClass);
		document.body.classList.remove(buttonsPointerClass);
	}

	function clearOnfinish(e){
		window.removeEventListener("hashchange", clearOnfinish);
		enableButtons();
		document.body.classList.remove("disable-toolbar-right");
		if(!e){
			requests = [];
			return;
		}
		if(requests){
			requests.forEach(function(request){
				request.abort();
			});
			requests = [];
		}
	}

	function ProgressBar(wrapper, request, onEndCallback){
		var progressbarEl = document.createElement("div"),
			progressEl = document.createElement("div"),
			progressValueEl = document.createElement("div"),
			buttonWrapper = document.createElement("div"),
			hideButton = document.createElement("button"),
			cancelButton = document.createElement("button"),
			textEl = document.createElement("p"),
			isRemoved;

		function setProgress(e){
			var percentLoaded;
			if(e.lengthComputable){
				percentLoaded = Math.round((e.loaded / e.total) * 100);
				progressValueEl.style.width = percentLoaded + "%";
				if(percentLoaded < 5){
					textEl.innerHTML = "Upload started.";
				}else if(percentLoaded < 98){
					textEl.innerHTML = "Uploading...";
				}else{
					textEl.innerHTML = "Finalizing";
				}
			}
		}

		function remove(e){
			e && e.stopPropagation();
			if(!isRemoved){
				isRemoved = true;
				onEndCallback && onEndCallback();
				setTimeout(function(){
					progressbarEl && progressbarEl.parentNode.removeChild(progressbarEl);
				}, 100);
			}
		}

		function cancel(e){
			e && e.stopPropagation();
			request.abort();
			remove();
		}

		request.upload.addEventListener("progress", setProgress);
		request.addEventListener("load", remove);

		progressbarEl.className = "progressbar item";
		progressEl.className = "progress";
		progressValueEl.className = "progress-value";
		buttonWrapper.className = "buttons-wrapper";
		textEl.innerHTML = "Waiting for upload.";
		progressEl.appendChild(progressValueEl);
		progressEl.appendChild(textEl);
		progressbarEl.appendChild(progressEl);
		cancelButton.addEventListener("click", cancel);
		cancelButton.innerHTML = "Cancel";
		cancelButton.className = "btn btn-default";
		buttonWrapper.appendChild(cancelButton);
		hideButton.addEventListener("click", remove);
		hideButton.innerHTML = "Hide";
		hideButton.className = "btn btn-default";
		buttonWrapper.appendChild(hideButton);
		progressbarEl.appendChild(buttonWrapper);
		wrapper.insertBefore(progressbarEl, wrapper.firstElementChild);
		wrapper.firstElementChild.scrollIntoView();
	}

	uploads = new function(){
		var urlPrefix,
			uploadingFiles = 0;

		function onloadCallback(){
			uploadingFiles--;
			if(uploadingFiles === 0){
				enableButtons();
				window.FileManager.files.addFileListContent();
				clearOnfinish();
			}
		}

		function uploadFile(file, callback, wrapper){
			var _type, _name, url, uploadRequest;
			_name = file.newName || file.name;
			_type = file.newType || file.type || window.FileManager.toolbox.getMIMEType(_name);

			url = "https://z.litestack.com/v1/" + FileManager.CurrentPath().get() + _name;//TODO: replace hardcode with smth
			uploadRequest = new XMLHttpRequest();
			requests.push(uploadRequest);
			new ProgressBar(wrapper ? wrapper : window.FileManager.elements.itemsWrapperEl, uploadRequest, callback);
			uploadRequest.open('PUT', url, true);

			uploadRequest.setRequestHeader('Content-Type', _type);
			uploadRequest.send(file);
			return uploadRequest;
		}

		this.uploadFiles = function(e){
			uploadingFiles = e.target.files.length;
			disableButtons();
			requests = e.target.files.map(function(file){
				uploadFile(file, onloadCallback);
			});
			e.target.value = [];
		};
		this.uploadFile = uploadFile;
	};

	function createDialog(file, onconfirm, oncancel){
		var wrapper = document.createElement("div"),
			form = document.createElement("form"),
			textEl, inputElement, button,
			buttonWrapper = document.createElement("div"),
			inputWrapper = document.createElement("div");
		wrapper.className = "item upload-as no-hover no-active";
		buttonWrapper.className = "button-wrapper";
		inputWrapper.className = "input-wrapper";
		form.className = "input-group";

		textEl = document.createElement("span");
		textEl.textContent = "New name";
		inputWrapper.appendChild(textEl);
		inputElement = document.createElement("input");
		inputElement.className = "form-control";
		inputElement.placeholder = textEl.textContent;
		inputElement.value = file.name;
		inputWrapper.appendChild(inputElement);

		textEl = document.createElement("span");
		textEl.textContent = "New type";
		inputWrapper.appendChild(textEl);
		inputElement = document.createElement("input");
		inputElement.className = "form-control";
		inputElement.placeholder = textEl.textContent;
		file.type && (inputElement.value = file.type);
		inputWrapper.appendChild(inputElement);
		form.appendChild(inputWrapper);

		button = document.createElement("button");
		button.className = "hot-buttons btn btn-primary";
		button.textContent = "OK";
		button.type = "submit";
		buttonWrapper.appendChild(button);
		button = document.createElement("button");
		button.className = "hot-buttons btn btn-default";
		button.textContent = "Cancel";
		button.type = "button";
		button.addEventListener("click", oncancel);
		buttonWrapper.appendChild(button);
		form.appendChild(buttonWrapper);

		form.addEventListener("submit", function(e){
			var name = e.target[0].value,
				type = e.target[1].value;
			e.preventDefault();
			name && (file.newName = name);
			type && (file.newType = type);
			onconfirm(file, wrapper);
			return false;//just in case
		});

		wrapper.appendChild(form);
		return wrapper;
	}

	function uploadAs(e){
		var filesCounter = e.target.files.length,
			wrapper = window.FileManager.elements.itemsWrapperEl,
			fragment = document.createDocumentFragment(),
			wasSmthUploded;

		e.target.files.forEach(function(file){
			fragment.appendChild(createDialog(file, onconfirm, oncancel));
		});
		e.target.value = null;
		wrapper.insertBefore(fragment, wrapper.firstElementChild);
		wrapper.getElementsByTagName("input")[0].focus();

		function onconfirm(file, wrapper){
			wrapper.removeChildren();
			uploads.uploadFile(file, onloadedCallback, wrapper);
			wasSmthUploded = true;
		}

		function oncancel(e){
			var el;
			onloadedCallback();
			el = window.FileManager.toolbox.getParentByClassName(e.target, "upload-as");
			el && el.parentNode.removeChild(el);
		}

		function onloadedCallback(){
			filesCounter--;
			if(!filesCounter){
				enableButtons();
				if(wasSmthUploded){
					window.FileManager.files.addFileListContent();
				}
				clearOnfinish();
			}
		}

		disableButtons();
	}

	function change(e){
		e.stopPropagation();
		e.preventDefault();
		switch(e.target.dataset.action){
			case "file":
				uploads.uploadFiles(e);
				break;
			case "as":
				uploadAs(e);
				break;
			case "exec":
				break;
			default:
				console.log("unkown action: " + e.target.dataset.action);
				break;
		}
		document.body.classList.add("disable-toolbar-right");
		window.addEventListener("hashchange", clearOnfinish);
		return false;
	}

	document.getElementsByClassName("upload-input").forEach(function(input){
		input.addEventListener("change", change);
	});
});