from league.game_registry import Game


TYPE = 'oix'


class OIXGame(Game):
    type = TYPE


def register_oix_game(game_registry):
    game_registry.register_game(OIXGame())
    game_registry.register_variant(TYPE, '3,3,3', {'rows': 3, 'cols': 3, 'winning': 3})
