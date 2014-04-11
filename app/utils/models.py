
from google.appengine.ext import ndb


class ModelMeta(object):
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
