import json
import sys
import urllib.request
import urllib.error


def main():
    url = "http://localhost:8000/api/users/register/"
    payload = {
        "email": "jerrupapada@gmail.com",
        "password": "Password123!",
        "password_confirm": "Password123!",
        "first_name": "Jerru",
        "last_name": "Papada",
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            print(f"Status: {resp.status}")
            print(body)
            return 0
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        print(f"HTTPError: {exc.code}")
        print(body)
        return 1
    except urllib.error.URLError as exc:
        print(f"URLError: {exc.reason}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
