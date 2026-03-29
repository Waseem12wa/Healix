"""
Unified Python microservice runner for Render.

Runs all Flask microservices in a single Python process using threaded WSGI servers.
This keeps the same endpoints and behavior while reducing per-process memory overhead.
"""

import os
import signal
import threading
import time
from typing import List, Tuple

from werkzeug.serving import make_server

from alternative_service import app as alternative_app
from ddi_service import app as ddi_app
from dfi_service import app as dfi_app
from side_effect_service import app as side_effect_app
from health_assistant_service import app as health_assistant_app
from medical_record_service import app as medical_record_app


class ServiceThread(threading.Thread):
    def __init__(self, name: str, app, host: str, port: int):
        super().__init__(name=f"svc-{name}", daemon=True)
        self.service_name = name
        self.host = host
        self.port = port
        self.server = make_server(host, port, app, threaded=True)
        self.context = app.app_context()
        self.context.push()

    def run(self):
        print(f"[services] starting {self.service_name} on http://{self.host}:{self.port}")
        self.server.serve_forever()

    def shutdown(self):
        print(f"[services] stopping {self.service_name}")
        self.server.shutdown()


HOST = "127.0.0.1"

SERVICES: List[Tuple[str, object, int]] = [
    ("ALT", alternative_app, int(os.environ.get("ALTERNATIVE_SERVICE_PORT", 5003))),
    ("DDI", ddi_app, int(os.environ.get("DDI_SERVICE_PORT", 5001))),
    ("DFI", dfi_app, int(os.environ.get("DFI_SERVICE_PORT", 5002))),
    ("SIDE", side_effect_app, int(os.environ.get("SIDE_EFFECT_SERVICE_PORT", 5004))),
    ("HEALTH", health_assistant_app, int(os.environ.get("HEALTH_ASSISTANT_SERVICE_PORT", 5006))),
    ("MEDREC", medical_record_app, int(os.environ.get("MEDICAL_RECORD_SERVICE_PORT", 5005))),
]


_running = True
_threads: List[ServiceThread] = []


def _stop_all(*_args):
    global _running
    _running = False
    for thread in _threads:
        try:
            thread.shutdown()
        except Exception as exc:
            print(f"[services] failed to stop {thread.service_name}: {exc}")


def main():
    signal.signal(signal.SIGINT, _stop_all)
    signal.signal(signal.SIGTERM, _stop_all)

    print("[services] unified Python runner starting")

    for name, app, port in SERVICES:
        thread = ServiceThread(name=name, app=app, host=HOST, port=port)
        _threads.append(thread)
        thread.start()

    print("[services] all microservices started")

    while _running:
        time.sleep(1)

    print("[services] unified Python runner stopped")


if __name__ == "__main__":
    main()
