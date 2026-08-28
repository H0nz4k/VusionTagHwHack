from pathlib import Path
p = Path("/tmp/ov26_uart_recap.bin")
b = p.read_bytes()
print("len", len(b))
print("head", b[:32].hex())
# strip bit7
s7 = bytes(x & 0x7F for x in b)
print("bit7cleared", s7[:80])
# xor 80
sx = bytes(x ^ 0x80 for x in b)
print("xor80", sx[:80])
# count high bit
hi = sum(1 for x in b if x & 0x80)
print("highbit", hi, "nul", b.count(0), "ff", b.count(0xFF))
# look for OpenVusion fragments
for label, data in ("raw", b), ("b7", s7), ("xor", sx):
    t = data.decode("ascii", "replace")
    print(label, "OpenVusion", t.find("OpenVusion"), "EXP", t.find("EXP"), "DONE", t.find("DONE"), "RESET", t.find("RESET"))
