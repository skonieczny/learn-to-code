from users.logic import get_users, create_user


NS = 'users'


def register_users(urls):
    urls.register(NS, 'user', get_users, create_user)
