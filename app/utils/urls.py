import webapp2
import json
from utils.logic import NothingDone


class _HttpHandler(webapp2.RequestHandler):

    def _do(self, handler, args):
        if handler is None:
            self.abort(405)
        # TODO: check request content type
        body_params = json.loads(self.request.body or '{}')
        query_params = dict(self.request.params)
        kwargs = dict(body_params)
        kwargs.update(query_params)
        actor = self.authenticator.authenticate(self.request)
        return_value = handler(actor, *args, **kwargs)
        output = self.serializer.serialize(return_value)
        self.response.headers['Content-Type'] = 'application/json'
        if isinstance(output, NothingDone):
            self.response.status = 400
            self.response.write(json.dumps([output.reason, output.data]))
            return
        print `output`
        self.response.write(json.dumps(output, ensure_ascii=True))

    def get(self, *args):
        self._do(self.get_handler, args)

    def post(self, *args):
        self._do(self.post_handler, args)


class URLs(object):
    
    def __init__(self, serializer, authenticator):
        self.mapping = {}
        self.serializer = serializer
        self.authenticator = authenticator
        
    def register(self, ns, method, read_handler, write_handler):
        self.mapping['/' + ns + '/' + method] = (read_handler, write_handler)
    
    def register_read(self, ns, method, handler):
        self.register(ns, method, handler, None)

    def register_write(self, ns, method, handler):
        self.register(ns, method, None, handler)

    def handler_list(self):
        ret = []
        for url, (read_handler, write_handler) in self.mapping.items():
            class Handler(_HttpHandler):
                get_handler = staticmethod(read_handler)
                post_handler = staticmethod(write_handler)
                serializer = self.serializer
                authenticator = self.authenticator
            ret.append((url, Handler))
        print ret
        return ret
