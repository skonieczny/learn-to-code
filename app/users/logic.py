from google.appengine.ext import ndb

from users.models import User
from utils.logic import NothingDone


UNCHANGED = object()


def get_users(actor, id=None):
    if id is None:
        return NothingDone('id missing')
    return [User.get_by_id(int(id))]


def create_user(actor, name, email):
    # TODO: add validation
    item = User(name=name, email=email)
    item.put()
    return item
