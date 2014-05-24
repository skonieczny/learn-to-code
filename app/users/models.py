
from google.appengine.ext import ndb
from utils.models import ModelMeta


class User(ModelMeta, ndb.Model):
    name = ndb.StringProperty()
    email = ndb.StringProperty()

# TODO: add serialization