;
(function (a) {

	// 依赖关系
	var _relation = {};
	// 状态
	var _status = {};
	var _sText = {
		ready : "ready",
		failed : "failed",
		loading : "loading",
		loaded : "loaded",
		success : "success",
		undefine : "undefined"
	};
	// 事件接口
	var _port = {};
	// 脚本位
	var _scriptBit = {};
	// 队列
	var _queue = [];
	// 缓存
	var _cache = {};
	// 临时存储对象
	var _temp = {};
	// 英文字母
	var _letter = "abcdefghijklmnopqrstuvwxyz";
	// 数组深拷贝
	var _APSC = function (arr) {
		return Array.prototype.slice.call(arr)
	};
	// 错误信息
	var errorMsg = ["依赖脚本记载失败", "初始化成功"];
	// 异常警报
	var _exception = function (type) {
		alert(errorMsg[type])
	};
	// 浏览器
	var _brower = (/webkit/i).test(a.navigator.appVersion) ? "webkit" : (/firefox/i).test(a.navigator.userAgent) ? "Moz" : "opera" in window ? "O" : (/MSIE/i).test(a.navigator.userAgent) ? "ms" : "";

	// 模块加载器状态
	var _moduleExecution = false;

	// 发布当前脚本状态
	function _publish(name, status) {
		if (_scriptBit[name]) {
			var i = 0,
			list = _scriptBit[name];
			for (var len = list.length; i < len; i += 1) {
				switch (status) {
				case _sText.loaded:
					_minus(list[i], name);
					_cache[name] = 1;
					break;
				case _sText.failed:
					_status[list[i]] = {
						status : 0,
						remark : _sText.failed
					}
					_cache[name] = 0;
					alert(list[i] + "方法初始化失败，" + name + "未加载到！");
					break;
				}
			}
			_scriptBit[name] = null;
		}
	}

	// 删除模块中匹配到的脚本
	function _minus(name, val) {
		var list = _relation[name]["relatedScript"],
		len = list.length;
		while (len--) {
			if (list[len] == val) {
				list.splice(len, 1);
			}
		}

		if (!list.length) {
			if (window.console) {
				console.log(name + " 初始化成功！")
			}
			_status[name] = {
				status : 1,
				remark : _sText.ready
			}
		}
	}

	// 抛出对应接口
	function _makeFn(name) {
		if (_status[name] && _status[name].status) {
			return _port[name]
		}
		return function () {
			var _args = _APSC(arguments),
			_rs = _APSC(_relation[name].relatedScript);
			_importJs(_rs, function () {
				_port[name].apply(null, _args);
			});
		}
	}

	// 声明脚本依赖状态
	function _relating(name, relation, func) {
		_relation[name] = {
			resource : relation || []
		};
		_relation[name]["relatedScript"] = _APSC(_relation[name].resource);
		var rs = _relation[name].relatedScript,
		len = rs.length;
		while (len--) {
			if (!_cache[rs[len]]) {
				_scriptBit[rs[len]] = _scriptBit[rs[len]] || [];
				_scriptBit[rs[len]].push(name);

			} else {
				rs.splice(len, 1);

			}

		}

		if (!!func)
			_port[name] = func;
		if (!rs.length) {
			//_port[name]=_makeFn(name,func);
		}
	}

	// 
	function _use(module, func) {
		var _arg = _APSC(arguments),
		_len = _arg.length,
		_fn = _arg[_len - 1];
		if (_len > 2) {
			module = _arg.slice(0, _len - 1)
				func = typeof _fn == "function" ? _fn : function () {};
		}
		_queue.push({
			module : module,
			fn : func
		});
		if (!_moduleExecution)
			_queueOrder();
	}

	// 按队列顺序执行
	function _queueOrder() {

		if (!_moduleExecution && _queue.length) {
			var _NewArg = _queue.splice(0, 1);
			_loadModule(_NewArg[0]["module"], _NewArg[0]["fn"]);
		}
	}

	// 加载模块
	function _loadModule(module, callback) {
		_moduleExecution = true;
		var list = module.constructor.name == "Array" ? module : new Array(module);
		function _walk() {
			var _cur = list.splice(0, 1);
			if (_cur.length && _relation[_cur[0]] && _relation[_cur[0]].relatedScript.length) {
				var _rs = _APSC(_relation[_cur[0]].relatedScript);
				_importJs(_rs, _walk);
			} else {
				callback();
				_moduleExecution = false;
				_queueOrder();
			}
		}
		_walk();
	}

	// script加载
	function _importJs(list, func) {
		function _load(src, call) {
			src = src[0];
			//if(_cache[src]=="loading"){return setTimeout(function(){_load([src],func)},10)}
			if (typeof src === 'string') {
				if (_cache[src] == "loaded") {
					return call()
				}
				var script = document.createElement("script"),
				head = document.getElementsByTagName("head")[0];
				script.type = "text/javascript";
				script.src = src;
				script.className = "we.js_at_" + new Date().getTime();
				head.appendChild(script);
				_cache[src] = "loading";
				script.onload = script.onreadystatechange = function () {
					if (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') {
						script.onload = script.onreadystatechange = null;
						//	head.removeChild(script);
						_publish(src, _sText.loaded);
						call();
					};
				}
				script.onerror = function () {
					head.removeChild(script);
					_publish(src, _sText.failed);
				}
			}
		}
		function _next() {
			if (list.length) {
				_load(list.splice(0, 1), _next)
			} else if (!!func) {
				func();
			}
		}
		_next();

	}

	//定义模块
	function _defineModule(relation) {
		for (var key in relation) {
			_relating(key, relation[key]);
		}
	}

	// at http://javascript.nwbox.com/IEContentLoaded/
	function IEContentLoaded(w, fn) {
		var d = w.document,
		done = false,
		// only fire once
		init = function () {
			if (!done) {
				a._isReady = done = true;
				fn();
			}
		};
		// polling for no errors
		(function () {
			try {
				// throws errors until after ondocumentready
				d.documentElement.doScroll('left');
			} catch (e) {
				setTimeout(arguments.callee, 50);
				return
			}
			// no errors, fire
			init();
		})();
		// trying to always fire before onload
		d.onreadystatechange = function () {
			if (d.readyState == 'complete') {
				d.onreadystatechange = null;
				init();
			}
		}
	}

	function webkitContentLoaded(fn) {
		document.addEventListener("DOMContentLoaded", function () {
			a._isReady = true;
			fn();
		}, false);
	}

	/*
	 * 暴露方法接口
	 */

	var we = function (func) {
		if (!!func) {
			if (a._isReady) {
				func();
			} else {
				if (_brower == "ms") {
					IEContentLoaded(a, func);
				} else {
					webkitContentLoaded(func);
				}
			}
		}
	}

	we.fn = function (name, func, relation) {
		_relating(name, relation, func);
	}

	we.use = _use;

	we.module = _defineModule;

	we.run = function (name) {
		return _makeFn(name);
	}
	a.we = we;
})(window);
