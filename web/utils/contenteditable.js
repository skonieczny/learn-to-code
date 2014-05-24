/**
 * @see http://docs.angularjs.org/guide/concepts
 * @see http://docs.angularjs.org/api/ng.directive:ngModel.NgModelController
 * @see https://github.com/angular/angular.js/issues/528#issuecomment-7573166
 */

angular.module('contenteditable', []).directive('contenteditable', function() {
	return {
		restrict : 'A',
		require : '?ngModel',
		link : function(scope, element, attr, ngModel) {
			if (!ngModel) {
				return;
			}
			
			ngModel.$render = function() {
				var html = ngModel.$viewValue;
				html = html.replace(/\&/g, '&amp;');
				html = html.replace(/\</g, '&lt;');
				html = html.replace(/\>/g, '&gt;');
				html = html.replace(/\"/g, '&quot;');
				html = html.replace(/\n/g, '<br>');
				html = html.replace(/ /g, '&nbsp;');
				return element.html(html);
			};
			
			element.bind('blur', function() {
				if (ngModel.$viewValue !== element.html().trim()) {
					return scope.$apply(read);
				}
			});
			
			var read = function() {
				var html = element.html().trim();
				var text = html.replace(/\n/g, '').replace(/\r/g, '');
				text = text.replace(/<br>/g, '\n');
				text = text.replace(/<\/div>/g, '\n');
				text = text.replace(/<div[^>]*>/g, '\n');
				text = text.replace(/(<([^>]+)>)/g, "");
				text = text.replace(/&nbsp;/g, " ");
				text = text.replace(/&amp;/g, "&");
				text = text.replace(/&lt;/g, "<");
				text = text.replace(/&gt;/g, ">");
				text = text.replace(/&quote;/g, "\"");
				return ngModel.$setViewValue(text);
			};
			return read;
		}
	};
}); 