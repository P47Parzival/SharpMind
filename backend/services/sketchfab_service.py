import io
import os
import zipfile
from pathlib import Path

import httpx

from config import get_settings

SKETCHFAB_BASE_URL = "https://api.sketchfab.com/v3"
DOWNLOAD_DIR = Path(__file__).resolve().parents[1] / "downloaded_models"


class SketchfabError(Exception):
    pass


def _auth_header_candidates() -> list[dict]:
    settings = get_settings()
    token = settings.SKETCHFAB_API_TOKEN.strip()
    if not token:
        raise SketchfabError("Sketchfab API token is not configured on backend.")

    # If user already provided a prefixed value, use it as-is.
    lower = token.lower()
    if lower.startswith("token ") or lower.startswith("bearer "):
        return [{"Authorization": token}]

    # Data API tokens typically use `Token`, OAuth uses `Bearer`.
    # We try both to be robust across account setups.
    return [
        {"Authorization": f"Token {token}"},
        {"Authorization": f"Bearer {token}"},
    ]


async def _get_with_auth_fallback(client: httpx.AsyncClient, url: str, params: dict | None = None) -> httpx.Response:
    last_response: httpx.Response | None = None
    for headers in _auth_header_candidates():
        response = await client.get(url, params=params, headers=headers)
        if response.status_code != 401:
            return response
        last_response = response

    return last_response if last_response is not None else await client.get(url, params=params)


async def fetch_model_from_sketchfab(query: str, base_url: str) -> dict:
    async with httpx.AsyncClient(timeout=45.0) as client:
        search_resp = await _get_with_auth_fallback(
            client,
            f"{SKETCHFAB_BASE_URL}/search",
            {
                "type": "models",
                "q": query,
                "downloadable": "true",
                "sort_by": "-likeCount",
            },
        )

        if search_resp.status_code != 200:
            raise SketchfabError(f"Sketchfab search failed ({search_resp.status_code}).")

        results = search_resp.json().get("results", [])
        if not results:
            raise SketchfabError("No downloadable Sketchfab model found for this search.")

        selected = results[0]
        uid = selected.get("uid")
        name = selected.get("name") or query

        if not uid:
            raise SketchfabError("Sketchfab returned an invalid model entry.")

        download_resp = await _get_with_auth_fallback(
            client,
            f"{SKETCHFAB_BASE_URL}/models/{uid}/download",
        )

        if download_resp.status_code != 200:
            detail = ""
            try:
                body = download_resp.json()
                detail = body.get("detail") or body.get("error") or ""
            except Exception:
                detail = ""

            suffix = f" Detail: {detail}" if detail else ""
            raise SketchfabError(
                f"Model download request failed for '{name}' ({download_resp.status_code}).{suffix}"
            )

        gltf_info = download_resp.json().get("gltf")
        if not gltf_info or not gltf_info.get("url"):
            raise SketchfabError(
                "Sketchfab did not return a downloadable glTF archive for this model."
            )

        archive_url = gltf_info["url"]
        archive_resp = await client.get(archive_url)
        if archive_resp.status_code != 200:
            raise SketchfabError("Could not download Sketchfab model archive.")

    model_dir = DOWNLOAD_DIR / uid
    if model_dir.exists():
        for root, dirs, files in os.walk(model_dir, topdown=False):
            for file in files:
                os.remove(Path(root) / file)
            for directory in dirs:
                os.rmdir(Path(root) / directory)
    model_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(io.BytesIO(archive_resp.content)) as archive:
        archive.extractall(model_dir)

    gltf_candidates = sorted(model_dir.rglob("*.gltf"))
    if not gltf_candidates:
        raise SketchfabError("Downloaded archive does not contain a .gltf scene file.")

    scene_file = gltf_candidates[0]
    relative_scene_path = scene_file.relative_to(model_dir).as_posix()

    if not base_url.endswith("/"):
        base_url = f"{base_url}/"

    public_url = f"{base_url}downloaded-models/{uid}/{relative_scene_path}"
    return {
        "source": "sketchfab",
        "model_name": name,
        "model_type": "GLTF",
        "model_url": public_url,
        "uid": uid,
    }
