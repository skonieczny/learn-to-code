from utils.urls import URLs
from league.game_registry import GameRegistry
from games.oix.game import register_oix_game
from league.urls import register_league


class Application(object):
    
    def __init__(self):
        self.urls = URLs()
        self.games = GameRegistry()


def create_application():
    app = Application()
    register_oix_game(app.games)
    register_league(app.urls)
    return app
