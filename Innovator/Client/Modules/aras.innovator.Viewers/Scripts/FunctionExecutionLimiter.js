require(['dojo/_base/declare'], function (declare) {
	return dojo.setObject(
		'VC.FunctionExecutionLimiter',
		declare(null, {
			minExecutionFrequency: 500,
			now: null,
			lastExecution: 0,

			execute: function (triggeredFunction) {
				this.now = +new Date();

				//filters one execution of function per 'minFrequency' milliseconds
				if (this.now - this.lastExecution > this.minExecutionFrequency) {
					this.lastExecution = this.now;

					if (triggeredFunction) {
						triggeredFunction();
					}
				}
			}
		})
	);
});
