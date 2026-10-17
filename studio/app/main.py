"""WithHammad Studio — API and web UI. One input (reference URL or image), everything else automatic."""
import os
import secrets
import shutil
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.templating import Jinja2Templates

from . import db

APP_DIR = Path(__file__).resolve().parent
UPLOADS = Path(os.environ.get('STUDIO_UPLOADS', '/data/uploads'))
IMAGE_TYPES = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp'}
MAX_IMAGE_BYTES = 15 * 1024 * 1024

@asynccontextmanager
async def lifespan(_app):
    db.migrate()
    UPLOADS.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title='WithHammad Studio', version='0.1.0', docs_url=None, redoc_url=None,
              lifespan=lifespan)
templates = Jinja2Templates(directory=str(APP_DIR / 'templates'))
basic = HTTPBasic(auto_error=False)


def require_user(credentials: HTTPBasicCredentials | None = Depends(basic)):
    user = os.environ.get('STUDIO_USER')
    password = os.environ.get('STUDIO_PASSWORD')
    if not user or not password:
        raise HTTPException(503, 'STUDIO_USER and STUDIO_PASSWORD must be set')
    ok = credentials is not None and \
        secrets.compare_digest(credentials.username.encode(), user.encode()) and \
        secrets.compare_digest(credentials.password.encode(), password.encode())
    if not ok:
        raise HTTPException(401, 'Unauthorized', headers={'WWW-Authenticate': 'Basic realm="studio"'})
    return credentials.username


@app.get('/healthz')
def healthz():
    return {'ok': True, 'schema_version': db.SCHEMA_VERSION}


def validate_url(url: str) -> str:
    url = (url or '').strip()
    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        raise HTTPException(422, 'Reference must be an http(s) URL')
    return url


@app.get('/', response_class=HTMLResponse)
def index(request: Request, user: str = Depends(require_user)):
    jobs = db.list_jobs()
    return templates.TemplateResponse(request, 'index.html', {'jobs': jobs, 'stages': db.STAGES})


@app.post('/jobs')
async def create_job(request: Request, reference: str = Form(''), image: UploadFile | None = None,
                     user: str = Depends(require_user)):
    if image is not None and image.filename:
        suffix = IMAGE_TYPES.get(image.content_type)
        if not suffix:
            raise HTTPException(422, 'Image must be PNG, JPEG or WebP')
        job_id = db.create_job('image', 'pending')
        target = UPLOADS / f'{job_id}{suffix}'
        size = 0
        with target.open('wb') as out:
            while chunk := await image.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    out.close()
                    target.unlink(missing_ok=True)
                    raise HTTPException(413, 'Image larger than 15 MB')
                out.write(chunk)
        with db.connect() as conn:
            conn.execute('UPDATE jobs SET source=? WHERE id=?', (str(target), job_id))
    else:
        job_id = db.create_job('url', validate_url(reference))
    if 'text/html' in request.headers.get('accept', ''):
        return RedirectResponse(f'/jobs/{job_id}', status_code=303)
    return JSONResponse({'id': job_id}, status_code=201)


@app.get('/jobs')
def list_jobs(user: str = Depends(require_user)):
    return db.list_jobs()


@app.get('/jobs/{job_id}')
def get_job(job_id: str, request: Request, user: str = Depends(require_user)):
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(404, 'No such job')
    if 'text/html' in request.headers.get('accept', ''):
        return templates.TemplateResponse(request, 'job.html', {'job': job, 'stages': db.STAGES})
    return job


@app.get('/disk')
def disk(user: str = Depends(require_user)):
    usage = shutil.disk_usage(UPLOADS.anchor or '/')
    return {'free_gb': round(usage.free / 1e9, 1), 'total_gb': round(usage.total / 1e9, 1)}
