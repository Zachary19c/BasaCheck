from fastapi import FastAPI

app = FastAPI(title="BasaCheck speech service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
