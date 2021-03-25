(function (context) {
	if (context && context.Worker) {
	    var nativeWorker = context.Worker;
	    context.workersBase = context.workersBase || [];
	    if (!context.workersBase.terminateAll) {
	        context.workersBase.terminateAll = function () {
	            for (var i = context.workersBase.length - 1; i >= 0; i--) {
	                context.workersBase[i].terminate();
	                delete context.workersBase[i];
	            }
	        }
	    }
	    if (!context.Worker.isFake) {
	        context.Worker = function (url) {
	            var worker = new nativeWorker(url);
	            context.workersBase.push(worker);

	            return worker;
	        }
	        context.Worker.isFake = true;
	    }
	}
})(window);
