"""Dev server: python -m http.server, but code/data never go stale between edits while art and audio are cached.

Code and data (.js .mjs .json .html .css) are sent no-store so edits show up on reload. Sprites, sounds and other
binary assets change rarely, so they are cached (revalidated with If-Modified-Since, which SimpleHTTPRequestHandler
answers with a 304) and the fight no longer re-downloads hundreds of files on every launch.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

NO_STORE_EXT = ('.js', '.mjs', '.json', '.html', '.htm', '.css', '.map')


class DevServer(ThreadingHTTPServer):
    request_queue_size = 256  # default backlog is 5: the loader opens dozens of connections at once and the extras got ERR_CONNECTION_RESET


class DevHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        path = self.path.split('?', 1)[0].lower()
        if path.endswith('/') or path.endswith(NO_STORE_EXT):
            self.send_header('Cache-Control', 'no-store')
        else:
            self.send_header('Cache-Control', 'public, max-age=300')  # art/audio rarely change; skip the network for 5 min
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    DevServer(('', port), partial(DevHandler, directory='.')).serve_forever()
