angular.module("templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("components/game.html","<h3>{{ game.data.name }}</h3>\n<ul>\n	{{ game.model.programsByScore().loading }}\n	{{ game.model.programsByScore().loaded }}\n	{{ game.model.programsByScore().items }}\n    <li ng-repeat=\"program in game.model.programsByScore().items()\">\n    	<a href=\"#/program/{{ program.id }}\">{{ program.data.name }}</a>\n    	by\n    	<a href=\"#/user/{{ program.model.author().id }}\">{{ program.model.author().data.name }}</a>\n    	Scored: {{ program.data.score }}\n    </li>\n</ul>\n<div expandable=\"Add program\">\n	<h4>Create program</h4>\n	<form ng-controller=\"ProgramCreateForm\">\n		<input type=\"text\" ng-model=\"program.name\">\n		<input type=\"text\" ng-model=\"program.game\">	\n		<button ng-click=\"create()\">Create</button>\n	</form>	\n</div>\n");
$templateCache.put("components/program.html","<h3>{{ program.data.name }}</h3>\nby\n<a href=\"#/user/{{ program.model.author().id }}\">{{ program.model.author().data.name }}</a>\nReady: {{ program.data.ready }}\n<a href=\"#/program/{{ program.id }}/edit\">Edit</a>\n<h4>Matches</h4>\n<ul>\n    <li ng-repeat=\"match in program.matchesFromNewest()\">\n    	Match on {{ match.variant }}\n    	<a href=\"#/program/{{ match.program2.id }}\">{{ match.program2.name }}</a>\n    	by\n    	<a href=\"#/user/{{ match.program2.author().id }}\">{{ match.program2.author().name }}</a>\n    	against\n    	<a href=\"#/program/{{ match.program2.id }}\">{{ match.program2.name }}</a>\n    	by\n    	<a href=\"#/user/{{ match.program2.author().id }}\">{{ match.program2.author().name }}</a>\n    	Result: {{ match.score1 }}:{{ match.score2 }}\n    </li>\n</ul>\n");
$templateCache.put("components/program_edit.html","<div ng-if=\"program.loaded\">\n	<h3>{{ program.data.name }}\n		<small>\n			(\n			<span ng-if=\"program.data.game == \'oix\'\">\n				OIX program\n			</span>\n			by\n			<a href=\"#/user/{{ program.model.author().id }}\">{{ program.model.author().data.name }}</a>\n			)\n		</small>\n	</h3>\n\n	<div class=\"container-fluid\">\n		<div class=\"row\">\n			<form ng-controller=\"ProgramEditForm\" class=\"col-xs-8\">\n				<div ui-ace=\"{mode: \'python\'}\" ng-model=\"program.data.data\"></div>\n				<button ng-click=\"update()\" class=\"btn btn-primary\">Save</button>\n			</form>\n			<div class=\"col-xs-4\" ng-include=\"\'components/games/\' + program.data.game + \'/board.html\'\">BOARD</div>\n		</div>\n	</div>\n</div>\n");
$templateCache.put("components/register.html","<h3>Register</h3>\n<ul>\n<div ng-controller=\"UserCreateForm\">\n	<form>\n		<input type=\"text\" ng-model=\"user.name\">\n		<input type=\"text\" ng-model=\"user.email\">	\n		<button ng-click=\"create()\">Register</button>\n	</form>	\n</div>\n");
$templateCache.put("directives/editor.html","<textarea class=\"program_data\" ng-model=\"model\"># Start your program here...</textarea>\n<div ui-ace=\"{mode: \'python\'}\" ng-model=\"model\"></div>\n");
$templateCache.put("main/main.html","<h3>List of Awesome Things</h3>\n<ul>\n    <li ng-repeat=\"game in games\">\n	    <a href=\"#/game/{{ game.id }}\">{{ game.name }}</a>\n    </li>\n</ul>\n");
$templateCache.put("components/games/oix/board.html","<div class=\"oix\" ng-controller=\"OIXGameBoardController\">\n	<h4>Test</h4>\n	<div>\n		Playing against: random-moves\n	</div>\n	<div>\n		Variant: {{ variant.type }}\n	</div>\n	<div>\n		<button ng-click=\"step()\" class=\"btn btn-primary\">Step</button>\n		<button ng-click=\"run()\" class=\"btn btn-primary\">Run</button>\n		<button ng-click=\"reset()\" class=\"btn btn-primary\">Reset</button>\n	</div>\n	<table class=\"board\">\n		<tr ng-repeat=\"row in board.rows\">\n			<td ng-repeat=\"cell in row track by $index\" class=\"cell-{{ cell }}\">\n				<span ng-show=\"cell == 1\">X</span>\n				<span ng-show=\"cell == -1\">O</span>\n				<span ng-show=\"cell == 0\">.</span>\n			</td>\n		</tr>\n	</table>\n	Output:\n	<pre>{{ output }}</pre>\n</div>\n");}]);