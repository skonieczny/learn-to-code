
from application import create_application
import webapp2


app = create_application()

app.urls.register_read('', '', lambda: 'ok, koles`')


application = webapp2.WSGIApplication(app.urls.handler_list(), debug=True)
# TODO, debug=False!
