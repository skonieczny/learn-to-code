from league.logic import create_program, update_program, delete_program,\
    resolve_match

NS = 'league'


def register_league(urls):
    urls.register_write(NS, 'create_program', create_program)
    urls.register_write(NS, 'update_program', update_program)
    urls.register_write(NS, 'delete_program', delete_program)
    urls.register_write(NS, 'resolve_match', resolve_match)
