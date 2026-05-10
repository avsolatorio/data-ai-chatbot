import requests
import json

payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "data360_compare_countries",
        "arguments": {
            "database_id": "WB_SSGD",
            "indicator_id": "WB_SSGD_UNEMPLOYMENT_RATE",
            "country_codes": "KEN;NGA"
        }
    }
}
res = requests.post("http://localhost:8021/messages", json=payload)
print(json.dumps(res.json(), indent=2))
