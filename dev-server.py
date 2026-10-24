"""Dev server: python -m http.server, but the browser never reuses stale files (ES modules, audio) between edits."""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8777
    ThreadingHTTPServer(('', port), partial(NoCacheHandler, directory='.')).serve_forever()
