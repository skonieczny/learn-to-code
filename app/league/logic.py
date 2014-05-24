from google.appengine.ext import ndb

from league.models import Program, Match, PendingMatch
from utils.logic import NothingDone
from league.compiling import compile_pr


UNCHANGED = object()


def get_programs(actor, id=None, game=None, order=None):
    ret = Program.query()
    if not game is None:
        ret = ret.filter(Program.game == game)
    if not id is None:
        ret = ret.filter(Program.key == ndb.Key(Program, int(id)))
    return ret.fetch(100)


def create_program(actor, game, name):
    program = Program(author=actor.key, game=game, name=name, ready=False, data='')
    program.put()
    return program


def update_program(actor, id, name=UNCHANGED, data=UNCHANGED, ready=UNCHANGED):
    id = int(id)
    program = Program.get_by_id(id)
    if program.author != actor.key:
        return NothingDone('no-permissions')
    if name is not UNCHANGED:
        program.name = name
    if data is not UNCHANGED:
        if program.ready is True:
            return NothingDone('cannot-change-ready-program-data')
        program.data = data
    if ready is not UNCHANGED:
        # TODO: can not set ready to False if not pending matches?
        if ready is True:
            game = get_game(program.game)
            errors = game.validate_program_data(program.data)
            if errors:
                return NothingDone(errors)
        program.ready = ready
    program.put()

    if ready is True:
        # create pending matches
        for variant in get_game_variants(program.game).keys():
            for competitor in Program.query(Program.game == program.game, Program.ready == True):
                pending_match = PendingMatch(game=program.game, variant=variant, program1=program, program2=competitor)
                pending_match.put()
                pending_match = PendingMatch(game=program.game, variant=variant, program2=program, program1=competitor)
                pending_match.put()

    if ready is False:
        # delete old matches and pending matches
        for match in Match.query(ndb.OR(Match.program1 == program, Match.program2 == program)):
            match.delete()
        for match in PendingMatch.query(ndb.OR(Match.program1 == program, Match.program2 == program)):
            match.delete()

    return program


def delete_program(actor, id):
    program = Program.get_by_id(id)
    if program.author != actor:
        return NothingDone('no-permissions')
    if program.ready is True:
        return NothingDone('can-not-delete-ready-program')
    program.delete()


def compile_program(actor, id, data):
    # TODO: validate actor and program
    try:
        code = compile_pr(data)
    except SyntaxError, e:
        return NothingDone('systax-error', lineno=e.lineno, offset=e.offset, text=e.text, value=str(e))
    except TypeError, e:
        # TODO: check!
        return NothingDone(e.value)
    return {'binary': code}


def resolve_match(actor, pending_match_id, score1, score2):
    # TODO: check if admin
    pending_match = PendingMatch.get_by_id(pending_match_id)
    match = Match(game=pending_match.game, variant=pending_match.variant, program1=pending_match.program1, program2=pending_match.program2, score1=score1, score2=score2)
    match.put()
    pending_match.delete()
    return match
