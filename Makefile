# Ƙura Alert — developer shortcuts
# Usage: make install && make api   (terminal 1), then make web (terminal 2)

.PHONY: help install api web dev test thresholds hindcast replay simulate clean

help:
	@echo "install      create the venv, install API + web dependencies"
	@echo "api          run FastAPI on http://127.0.0.1:8000 (reload)"
	@echo "web          run Next.js on http://127.0.0.1:3000"
	@echo "test         run the API test suite"
	@echo "thresholds   regenerate data/thresholds.json from public archives"
	@echo "hindcast     rebuild data/hindcast.json (held-out seasons, sensitivity)"
	@echo "replay       rebuild data/replay.json (network required once)"
	@echo "simulate     post three simulated Arduino readings"
	@echo "clean        remove build artefacts and local caches"

install:
	cd services/api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd apps/web && npm install

api:
	cd services/api && .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

web:
	cd apps/web && npm run dev

dev:
	@echo "Run 'make api' and 'make web' in two terminals."

test:
	cd services/api && .venv/bin/pytest -q

thresholds:
	cd services/api && .venv/bin/python scripts/derive_thresholds.py

hindcast:
	cd services/api && .venv/bin/python scripts/hindcast.py

replay:
	cd services/api && .venv/bin/python scripts/build_replay.py

simulate:
	python3 hardware/scripts/simulate_node.py --api http://127.0.0.1:8000 --count 3 --interval 2

clean:
	rm -rf apps/web/.next services/api/.pytest_cache services/api/app/__pycache__ services/api/app/sources/__pycache__
	find . -name '__pycache__' -type d -prune -exec rm -rf {} +
