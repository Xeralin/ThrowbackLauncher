import json
import socket
import sys
import time

port_file = sys.argv[1]
port = None
for _ in range(80):
    try:
        text = open(port_file).read().strip()
        if text:
            port = int(text)
            break
    except (OSError, ValueError):
        pass
    time.sleep(0.25)

if port is None:
    print("NO PORT FILE")
    sys.exit(1)

print("port =", port)
sock = socket.create_connection(("127.0.0.1", port), timeout=5)
sock.sendall(b'{"cmd": "hello", "protocol": 1}\n')
sock.sendall(b'{"cmd": "requestTree"}\n')
sock.sendall(b'{"cmd": "setMod", "mod": "godMode", "enabled": true}\n')
sock.sendall(b'{"cmd": "setGametype", "gametypeId": "987654321"}\n')
sock.sendall(b'{"cmd": "setMod", "mod": "harvard", "enabled": true}\n')
sock.sendall(b'{"cmd": "endRound"}\n')
sock.sendall(b'{"cmd": "setMadHouse", "variant": 2}\n')

sock.settimeout(4)
buf = b""
events = []
try:
    while len(events) < 8:
        data = sock.recv(4096)
        if not data:
            break
        buf += data
        while b"\n" in buf:
            line, buf = buf.split(b"\n", 1)
            if line.strip():
                events.append(json.loads(line.decode("utf-8")))
except socket.timeout:
    pass

sock.close()
seen_state = None
seen_tree = False
tree_obj = "MISSING"
for e in events:
    if e.get("event") == "state":
        seen_state = e
    if e.get("event") == "tree":
        seen_tree = True
        tree_obj = e.get("tree")

print("events received:", len(events))
print("tree event:", seen_tree)
if tree_obj is None:
    print("tree: null (build has no tree params, or root unresolved)")
elif isinstance(tree_obj, dict):
    kids = tree_obj.get("children", [])
    print("tree root:", tree_obj.get("text"), "id", tree_obj.get("id"), "| top-level nodes:", len(kids))
    for k in kids[:4]:
        print("   node:", repr(k.get("text"))[:40], "children:", len(k.get("children", [])))
if seen_state:
    print("state.attached =", seen_state.get("attached"))
    print("state.tier =", seen_state.get("tier"))
    print("state.status =", seen_state.get("status"))
    caps = seen_state.get("capabilities", {})
    print("caps.godMode =", caps.get("godMode"), "| caps.unlockAll =", caps.get("unlockAll"),
          "| caps.displayBuild =", caps.get("displayBuild"))
    print("caps.harvard =", caps.get("harvard"), "| caps.endRound =", caps.get("endRound"),
          "| caps.madHouse =", caps.get("madHouse"), "(Y4S4: harvard/madHouse false by season/build, endRound true)")
    print("state.ready =", seen_state.get("ready"))
    print("madHouseVariants =", seen_state.get("madHouseVariants"))
else:
    print("NO STATE EVENT")
