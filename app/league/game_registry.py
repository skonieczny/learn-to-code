

class Game(object):
    
    def validate_program(self, data):
        if not data:
            return 'program-empty'


class GameRegistry(object):
    
    def __init__(self):
        self.games = {}
        self.variants = {}

    def register_game(self, game):
        self.games[game.type] = game
        self.variants[game.type] = {}

    def register_variant(self, game_type, variant, data):
        self.variants[game_type][variant] = data

    def get_game(self, game_type):
        return self.games[game_type]

    def get_game_variants(self, game_type):
        return self.variants[game_type]
