
from google.appengine.ext import ndb
from utils.models import ModelMeta


class Program(ModelMeta, ndb.Model):
    game = ndb.StringProperty()
    author = ndb.StringProperty()
    name = ndb.StringProperty()
    ready = ndb.BooleanProperty()
    data = ndb.TextProperty()


class Match(ModelMeta, ndb.Model):
    game = ndb.StringProperty()
    variant = ndb.StringProperty()
    program1 = ndb.KeyProperty(kind=Program)
    program2 = ndb.KeyProperty(kind=Program)
    score1 = ndb.FloatProperty()
    score2 = ndb.FloatProperty()


class PendingMatch(ModelMeta, ndb.Model):
    game = ndb.StringProperty()
    variant = ndb.StringProperty()
    program1 = ndb.KeyProperty(kind=Program)
    program2 = ndb.KeyProperty(kind=Program)
