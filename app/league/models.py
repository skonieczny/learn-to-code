
from google.appengine.ext import ndb
from utils.models import ModelMeta
from users.models import User


class Program(ModelMeta, ndb.Model):
    game = ndb.StringProperty()
    author = ndb.KeyProperty(kind=User)
    name = ndb.StringProperty()
    ready = ndb.BooleanProperty()
    data = ndb.TextProperty()
    binary = ndb.BlobProperty()


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
