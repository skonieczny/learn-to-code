from league.logic import get_programs, create_program, update_program, delete_program, compile_program, resolve_match

NS = 'league'


def register_league(urls):
    urls.register(NS, r'program', get_programs, create_program)
    urls.register(NS, r'program/(?P<id>\d+)', get_programs, update_program)
    urls.register_write(NS, r'program/(?P<id>\d+)/delete', delete_program)
    urls.register_write(NS, r'program/(?P<id>\d+)/compile', compile_program)
    urls.register_write(NS, r'match/(?P<id>\d+)/resolve', resolve_match)
