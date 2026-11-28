FROM mcr.microsoft.com/playwright/python:v1.55.0-noble
RUN pip install --no-cache-dir playwright==1.55.0
WORKDIR /app
COPY replier.py .
ENV DATA=/data PYTHONUNBUFFERED=1
CMD ["python", "replier.py", "loop"]
