from league.models import Program, Match, PendingMatch
from utils.logic import NothingDone


UNCHANGED = object()


def create_program(actor, game_id, name):
    program = Program(author=actor, game=game_id, name=name, ready=False, data='')
    program.put()
    return program


def update_program(actor, program_id, name=UNCHANGED, data=UNCHANGED, ready=UNCHANGED):
    program = Program.get_by_id(program_id)
    if program.author != actor:
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


def delete_program(actor, program_id):
    program = Program.get_by_id(program_id)
    if program.author != actor:
        return NothingDone('no-permissions')
    if program.ready is True:
        return NothingDone('can-not-delete-ready-program')
    program.delete()


def resolve_match(actor, pending_match_id, score1, score2):
    # TODO: check if admin
    pending_match = PendingMatch.get_by_id(pending_match_id)
    match = Match(game=pending_match.game, variant=pending_match.variant, program1=pending_match.program1, program2=pending_match.program2, score1=score1, score2=score2)
    match.put()
    pending_match.delete()
    return match
