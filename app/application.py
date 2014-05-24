import types
from datetime import datetime
from google.appengine.ext import ndb

from utils.urls import URLs
from league.game_registry import GameRegistry
from games.oix.game import register_oix_game
from league.urls import register_league
from users.urls import register_users
from users.models import User


def _serialize(obj):
    t = type(obj)
    if t in (int, float, str, unicode):
        return obj
    if t in (list, tuple):
        return [_serialize(x) for x in obj]
    if t == dict:
        return {x: _serialize(y) for x, y in obj.items()}
    if isinstance(obj, ndb.Model):
        d = obj.to_dict()
        d['id'] = obj.key.id()
        return _serialize(d)
    if t == ndb.Key:
        return obj.id()
    if t == datetime:
        return obj.isoformat()
    if obj is None:
        return None
    if isinstance(obj, types.CodeType):
        binary = {}
        for prop in ('co_name', 'co_argcount', 'co_nlocals', 'co_varnames', 'co_cellvars', 'co_freevars', 'co_code', 'co_consts', 'co_names', 'co_filename', 'co_firstlineno', 'co_lnotab', 'co_stacksize', 'co_flags'):
            binary[prop] = _serialize(getattr(obj, prop))
        for prop in ('co_code', 'co_lnotab'):
            binary[prop] = binary[prop].decode('latin-1')
        return binary
    return obj


class Serializer(object):
    
    def serialize(self, obj):
        ret = _serialize(obj)
        return ret


class Authenticator(object):

    def authenticate(self, request):
        users = User.query().fetch(1)
        if not users:
            return None 
        return users[0]


class Application(object):
    
    def __init__(self):
        serializer = Serializer()
        authenticator = Authenticator()
        self.urls = URLs(serializer, authenticator)
        self.games = GameRegistry()


def create_application():
    app = Application()
    register_oix_game(app.games)
    register_league(app.urls)
    register_users(app.urls)
    return app
