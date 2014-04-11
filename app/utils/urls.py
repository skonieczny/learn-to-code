import webapp2
import json
from utils.logic import NothingDone


class _HttpHandler(webapp2.RequestHandler):
    
    def _do(self, handler):
        if handler is None:
            self.abort(405)
        # TODO: check request content type
        input = json.loads(self.request.body or '{}')
        output = handler(**input)
        self.response.headers['Content-Type'] = 'application/json'
        if isinstance(output, NothingDone):
            self.response.code(400)
            self.response.write(json.dumps(output.reason))
        self.response.write(json.dumps(output))

    def get(self):
        self._do(self.get_handler)

    def post(self):
        self._do(self.post_handler)


class URLs(object):
    
    def __init__(self):
        self.mapping = {}
        
    def register(self, ns, method, read_handler, write_handler):
        self.mapping[ns + '/' + method] = (read_handler, write_handler)
    
    def register_read(self, ns, method, handler):
        self.register(ns, method, handler, None)

    def register_write(self, ns, method, handler):
        self.register(ns, method, None, handler)

    def handler_list(self):
        ret = []
        for url, (read_handler, write_handler) in self.mapping.items():
            class Handler(_HttpHandler):
                get_handler = read_handler
                post_handler = write_handler    
            ret.append((url, Handler))
        return ret
