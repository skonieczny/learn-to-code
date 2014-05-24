
from application import create_application
import webapp2


app = create_application()


# TODO, debug=False!
application = webapp2.WSGIApplication(app.urls.handler_list(), debug=True)
