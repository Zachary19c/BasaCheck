# Speech service

Local FastAPI + faster-whisper service. Bound to localhost. Tested with Python 3.12.

```powershell
cd speech-service
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Calling `.venv\Scripts\python` directly avoids `Activate.ps1`, which fails when PowerShell script execution is disabled.

Check: http://127.0.0.1:8000/health
