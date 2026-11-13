"""Fetch a company and its board from the Bolagskvarnen sandbox.

Usage:
    export BOLAGSKVARNEN_KEY=gb_test_...
    python lookup.py 569900-0013

Needs a test key (fictional companies). Live data is not open yet.
"""

import os
import sys

import requests

BASE = os.environ.get("BOLAGSKVARNEN_URL", "https://app.bolagskvarnen.se/api/v1")


def get(path: str) -> dict:
    res = requests.get(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {os.environ['BOLAGSKVARNEN_KEY']}"},
        timeout=10,
    )
    body = res.json()
    if body["status"] != "ok":
        raise RuntimeError(f"{body['error']['code']}: {body['error']['message']}")
    return body


def main() -> None:
    if "BOLAGSKVARNEN_KEY" not in os.environ:
        sys.exit("Set BOLAGSKVARNEN_KEY to a test key (gb_test_...).")
    org_number = sys.argv[1] if len(sys.argv) > 1 else "569900-0013"

    company = get(f"/companies/{org_number}")
    data = company["data"]
    print(f"{data['name']} ({data['org_number']})")
    print(f"  form:   {data['legal_form']['text']}")
    print(f"  status: {data['status']['text']}")
    print(f"  seat:   {data['seat']['municipality']}")
    print(f"  source: {[a['supplier'] for a in company['meta']['attribution']]}, cost {company['meta']['cost_sek']} SEK")

    roles = get(f"/companies/{org_number}/roles")["data"]
    print("Board and other roles:")
    for role in roles["roles"]:
        print(f"  {role['role']}: {role['name']} (from {role['from_date']})")
    for text in roles["signatory_rights"]:
        print(f"  Signatory rights: {text}")


if __name__ == "__main__":
    main()
