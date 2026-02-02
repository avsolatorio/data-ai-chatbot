alembic upgrade head && gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --timeout 300
